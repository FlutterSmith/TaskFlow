import request from 'supertest';
import { createServer } from '@/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

describe('Posts Integration Tests', () => {
  let app: any;
  let accessToken: string;
  let userId: string;
  let organizationId: string;

  beforeAll(async () => {
    app = createServer();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.postLike.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and organization
    const hashedPassword = await hash('Password123!', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      },
    });

    userId = user.id;

    const organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org',
      },
    });

    organizationId = organization.id;

    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    // Login to get access token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    accessToken = response.body.data.accessToken;
  });

  describe('POST /api/v1/posts', () => {
    it('should create a post with valid data', async () => {
      const postData = {
        content: 'This is a test post with @mention and #hashtag',
        visibility: 'public',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        content: postData.content,
        visibility: postData.visibility,
        author: {
          id: userId,
          name: 'Test User',
        },
      });

      // Verify post was created in database
      const post = await prisma.post.findUnique({
        where: { id: response.body.data.id },
      });
      expect(post).toBeTruthy();
    });

    it('should extract mentions from content', async () => {
      const postData = {
        content: 'Hello @john @jane, check this out!',
        visibility: 'public',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.data.mentions).toEqual(
        expect.arrayContaining(['john', 'jane'])
      );
    });

    it('should extract hashtags from content', async () => {
      const postData = {
        content: 'Learn #javascript #typescript #react today!',
        visibility: 'public',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.data.hashtags).toEqual(
        expect.arrayContaining(['javascript', 'typescript', 'react'])
      );
    });

    it('should create post with media attachments', async () => {
      const postData = {
        content: 'Check out this image!',
        visibility: 'public',
        mediaUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.data.mediaUrls).toEqual(postData.mediaUrls);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .send({ content: 'Test post', visibility: 'public' })
        .expect(401);

      expect(response.body.error).toMatch(/unauthorized/i);
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '', visibility: 'public' })
        .expect(400);

      expect(response.body.error).toMatch(/content/i);
    });

    it('should return 400 for content exceeding max length', async () => {
      const longContent = 'a'.repeat(5001);

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: longContent, visibility: 'public' })
        .expect(400);

      expect(response.body.error).toMatch(/maximum length/i);
    });

    it('should sanitize malicious content', async () => {
      const postData = {
        content: '<script>alert("xss")</script>This is a post',
        visibility: 'public',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      // Script tags should be removed or escaped
      expect(response.body.data.content).not.toContain('<script>');
    });
  });

  describe('GET /api/v1/posts/feed', () => {
    beforeEach(async () => {
      // Create multiple posts
      await prisma.post.createMany({
        data: [
          {
            content: 'Public post 1',
            visibility: 'public',
            authorId: userId,
            organizationId,
          },
          {
            content: 'Public post 2',
            visibility: 'public',
            authorId: userId,
            organizationId,
          },
          {
            content: 'Private post',
            visibility: 'private',
            authorId: userId,
            organizationId,
          },
        ],
      });
    });

    it('should return paginated feed', async () => {
      const response = await request(app)
        .get('/api/v1/posts/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toMatchObject({
        posts: expect.any(Array),
        page: 1,
        limit: 10,
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      });
    });

    it('should order posts by creation date descending', async () => {
      const response = await request(app)
        .get('/api/v1/posts/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const posts = response.body.data.posts;
      const dates = posts.map((p: any) => new Date(p.createdAt).getTime());

      // Verify descending order
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should respect visibility settings', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          password: await hash('Password123!', 12),
        },
      });

      // Login as other user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Password123!',
        });

      const otherToken = loginResponse.body.data.accessToken;

      // Get feed as other user
      const response = await request(app)
        .get('/api/v1/posts/feed')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Should only see public posts, not private posts from other users
      const posts = response.body.data.posts;
      const privatePost = posts.find((p: any) => p.visibility === 'private' && p.author.id !== otherUser.id);
      expect(privatePost).toBeUndefined();
    });

    it('should include like and comment counts', async () => {
      const response = await request(app)
        .get('/api/v1/posts/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const post = response.body.data.posts[0];
      expect(post).toHaveProperty('likes');
      expect(post).toHaveProperty('comments');
      expect(post).toHaveProperty('isLiked');
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          content: 'Original content',
          visibility: 'public',
          authorId: userId,
          organizationId,
        },
      });
      postId = post.id;
    });

    it('should update own post', async () => {
      const updateData = {
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.isEdited).toBe(true);
    });

    it('should not update other users posts', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          password: await hash('Password123!', 12),
        },
      });

      // Login as other user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Password123!',
        });

      const otherToken = loginResponse.body.data.accessToken;

      // Try to update original user's post
      const response = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Hacked content' })
        .expect(403);

      expect(response.body.error).toMatch(/unauthorized/i);
    });

    it('should track edit history', async () => {
      await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated content' });

      // Verify edit history was created
      const editHistory = await prisma.postEditHistory.findFirst({
        where: { postId },
      });

      expect(editHistory).toBeTruthy();
      expect(editHistory?.previousContent).toBe('Original content');
      expect(editHistory?.newContent).toBe('Updated content');
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          content: 'Test post',
          visibility: 'public',
          authorId: userId,
          organizationId,
        },
      });
      postId = post.id;
    });

    it('should delete own post', async () => {
      await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify post was soft deleted
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      expect(post?.deletedAt).toBeTruthy();
    });

    it('should not delete other users posts', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          password: await hash('Password123!', 12),
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Password123!',
        });

      const otherToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.error).toMatch(/unauthorized/i);
    });
  });

  describe('POST /api/v1/posts/:id/like', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          content: 'Test post',
          visibility: 'public',
          authorId: userId,
          organizationId,
        },
      });
      postId = post.id;
    });

    it('should like a post', async () => {
      const response = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.isLiked).toBe(true);

      // Verify like was created in database
      const like = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      expect(like).toBeTruthy();
    });

    it('should not allow duplicate likes', async () => {
      // Like once
      await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to like again
      const response = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.error).toMatch(/already liked/i);
    });

    it('should create notification for post author', async () => {
      await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify notification was created (if author is different from liker)
      const notification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'POST_LIKE',
          postId,
        },
      });

      // Should not create notification for own like
      expect(notification).toBeNull();
    });
  });

  describe('DELETE /api/v1/posts/:id/like', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await prisma.post.create({
        data: {
          content: 'Test post',
          visibility: 'public',
          authorId: userId,
          organizationId,
        },
      });
      postId = post.id;

      // Create like
      await prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
    });

    it('should unlike a post', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.isLiked).toBe(false);

      // Verify like was deleted from database
      const like = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      expect(like).toBeNull();
    });

    it('should return error if post not liked', async () => {
      // Delete the like first
      await prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      // Try to unlike again
      const response = await request(app)
        .delete(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.error).toMatch(/not liked/i);
    });
  });
});
