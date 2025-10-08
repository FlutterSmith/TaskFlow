import { PostService } from '@/services/post.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('PostService', () => {
  let postService: PostService;
  const mockUserId = 'user-123';
  const mockOrganizationId = 'org-123';

  beforeEach(() => {
    postService = new PostService();
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post with valid data', async () => {
      // Arrange
      const postData = {
        content: 'This is a test post with @mention and #hashtag',
        visibility: 'public' as const,
        mediaUrls: ['https://example.com/image.jpg'],
      };

      const mockPost = {
        id: 'post-123',
        content: postData.content,
        visibility: postData.visibility,
        authorId: mockUserId,
        organizationId: mockOrganizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      // Act
      const result = await postService.createPost(
        postData,
        mockUserId,
        mockOrganizationId
      );

      // Assert
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: postData.content,
          visibility: postData.visibility,
          authorId: mockUserId,
          organizationId: mockOrganizationId,
        }),
      });
      expect(result.id).toBe('post-123');
    });

    it('should extract mentions from content', async () => {
      // Arrange
      const postData = {
        content: 'Hello @john @jane, check this out!',
        visibility: 'public' as const,
      };

      const mockPost = {
        id: 'post-123',
        content: postData.content,
        authorId: mockUserId,
        mentions: ['john', 'jane'],
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      // Act
      const result = await postService.createPost(
        postData,
        mockUserId,
        mockOrganizationId
      );

      // Assert
      expect(result.mentions).toEqual(['john', 'jane']);
    });

    it('should extract hashtags from content', async () => {
      // Arrange
      const postData = {
        content: 'Check out this #javascript #typescript tutorial!',
        visibility: 'public' as const,
      };

      const mockPost = {
        id: 'post-123',
        content: postData.content,
        hashtags: ['javascript', 'typescript'],
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      // Act
      const result = await postService.createPost(
        postData,
        mockUserId,
        mockOrganizationId
      );

      // Assert
      expect(result.hashtags).toEqual(['javascript', 'typescript']);
    });

    it('should throw error for empty content', async () => {
      // Arrange
      const postData = {
        content: '',
        visibility: 'public' as const,
      };

      // Act & Assert
      await expect(
        postService.createPost(postData, mockUserId, mockOrganizationId)
      ).rejects.toThrow('Post content cannot be empty');
    });

    it('should throw error for content exceeding max length', async () => {
      // Arrange
      const longContent = 'a'.repeat(5001); // Assuming max length is 5000
      const postData = {
        content: longContent,
        visibility: 'public' as const,
      };

      // Act & Assert
      await expect(
        postService.createPost(postData, mockUserId, mockOrganizationId)
      ).rejects.toThrow('Post content exceeds maximum length');
    });

    it('should validate media URLs', async () => {
      // Arrange
      const postData = {
        content: 'Check out this image',
        visibility: 'public' as const,
        mediaUrls: ['not-a-valid-url'],
      };

      // Act & Assert
      await expect(
        postService.createPost(postData, mockUserId, mockOrganizationId)
      ).rejects.toThrow('Invalid media URL');
    });
  });

  describe('updatePost', () => {
    it('should update post with valid data', async () => {
      // Arrange
      const postId = 'post-123';
      const updateData = {
        content: 'Updated content',
      };

      const existingPost = {
        id: postId,
        authorId: mockUserId,
        content: 'Original content',
      };

      const updatedPost = {
        ...existingPost,
        ...updateData,
        updatedAt: new Date(),
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(existingPost);
      (prisma.post.update as jest.Mock).mockResolvedValue(updatedPost);

      // Act
      const result = await postService.updatePost(
        postId,
        updateData,
        mockUserId
      );

      // Assert
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: updateData,
      });
      expect(result.content).toBe(updateData.content);
    });

    it('should throw error if post does not exist', async () => {
      // Arrange
      const postId = 'non-existent';
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        postService.updatePost(postId, { content: 'Updated' }, mockUserId)
      ).rejects.toThrow('Post not found');
    });

    it('should throw error if user is not the author', async () => {
      // Arrange
      const postId = 'post-123';
      const differentUserId = 'different-user';

      const existingPost = {
        id: postId,
        authorId: mockUserId, // Different from the updating user
        content: 'Original content',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(existingPost);

      // Act & Assert
      await expect(
        postService.updatePost(postId, { content: 'Updated' }, differentUserId)
      ).rejects.toThrow('Unauthorized to update this post');
    });

    it('should track edit history', async () => {
      // Arrange
      const postId = 'post-123';
      const updateData = { content: 'Updated content' };

      const existingPost = {
        id: postId,
        authorId: mockUserId,
        content: 'Original content',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(existingPost);
      (prisma.post.update as jest.Mock).mockResolvedValue({
        ...existingPost,
        ...updateData,
      });

      // Act
      await postService.updatePost(postId, updateData, mockUserId);

      // Assert
      expect(prisma.postEditHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postId,
          previousContent: 'Original content',
          newContent: 'Updated content',
        }),
      });
    });
  });

  describe('deletePost', () => {
    it('should soft delete post', async () => {
      // Arrange
      const postId = 'post-123';

      const existingPost = {
        id: postId,
        authorId: mockUserId,
        content: 'Test post',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(existingPost);
      (prisma.post.update as jest.Mock).mockResolvedValue({
        ...existingPost,
        deletedAt: new Date(),
      });

      // Act
      await postService.deletePost(postId, mockUserId);

      // Assert
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error if user is not the author', async () => {
      // Arrange
      const postId = 'post-123';
      const differentUserId = 'different-user';

      const existingPost = {
        id: postId,
        authorId: mockUserId,
        content: 'Test post',
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(existingPost);

      // Act & Assert
      await expect(
        postService.deletePost(postId, differentUserId)
      ).rejects.toThrow('Unauthorized to delete this post');
    });

    it('should delete associated media files', async () => {
      // Arrange
      const postId = 'post-123';

      const existingPost = {
        id: postId,
        authorId: mockUserId,
        mediaUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(existingPost);

      // Act
      await postService.deletePost(postId, mockUserId);

      // Assert
      expect(postService.deleteMediaFiles).toHaveBeenCalledWith(
        existingPost.mediaUrls
      );
    });
  });

  describe('getFeed', () => {
    it('should return paginated feed', async () => {
      // Arrange
      const mockPosts = [
        { id: '1', content: 'Post 1', createdAt: new Date() },
        { id: '2', content: 'Post 2', createdAt: new Date() },
        { id: '3', content: 'Post 3', createdAt: new Date() },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as jest.Mock).mockResolvedValue(10);

      // Act
      const result = await postService.getFeed(mockUserId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should respect visibility settings', async () => {
      // Arrange
      const mockPosts = [
        { id: '1', content: 'Public post', visibility: 'public' },
        { id: '2', content: 'Friends post', visibility: 'friends' },
      ];

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      // Act
      await postService.getFeed(mockUserId, { page: 1, limit: 10 });

      // Assert
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { visibility: 'public' },
              {
                visibility: 'friends',
                author: { friends: { some: { friendId: mockUserId } } },
              },
              { authorId: mockUserId },
            ],
          }),
        })
      );
    });

    it('should order by creation date descending', async () => {
      // Arrange
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await postService.getFeed(mockUserId, { page: 1, limit: 10 });

      // Assert
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('likePost', () => {
    it('should add like to post', async () => {
      // Arrange
      const postId = 'post-123';

      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.postLike.create as jest.Mock).mockResolvedValue({
        postId,
        userId: mockUserId,
      });

      // Act
      await postService.likePost(postId, mockUserId);

      // Assert
      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: { postId, userId: mockUserId },
      });
    });

    it('should not add duplicate like', async () => {
      // Arrange
      const postId = 'post-123';

      const existingLike = {
        postId,
        userId: mockUserId,
      };

      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(existingLike);

      // Act & Assert
      await expect(
        postService.likePost(postId, mockUserId)
      ).rejects.toThrow('Post already liked');
    });

    it('should create notification for post author', async () => {
      // Arrange
      const postId = 'post-123';
      const authorId = 'author-456';

      const mockPost = {
        id: postId,
        authorId,
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.postLike.create as jest.Mock).mockResolvedValue({
        postId,
        userId: mockUserId,
      });

      // Act
      await postService.likePost(postId, mockUserId);

      // Assert
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: authorId,
          type: 'POST_LIKE',
          postId,
          actorId: mockUserId,
        }),
      });
    });
  });

  describe('unlikePost', () => {
    it('should remove like from post', async () => {
      // Arrange
      const postId = 'post-123';

      const existingLike = {
        postId,
        userId: mockUserId,
      };

      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(existingLike);

      // Act
      await postService.unlikePost(postId, mockUserId);

      // Assert
      expect(prisma.postLike.delete).toHaveBeenCalledWith({
        where: {
          postId_userId: {
            postId,
            userId: mockUserId,
          },
        },
      });
    });

    it('should throw error if like does not exist', async () => {
      // Arrange
      const postId = 'post-123';

      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        postService.unlikePost(postId, mockUserId)
      ).rejects.toThrow('Post not liked');
    });
  });
});
