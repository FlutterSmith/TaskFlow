import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from '@/components/posts/PostCard';
import { useAuth } from '@/hooks/useAuth';
import { useLikePost, useDeletePost } from '@/hooks/usePosts';

// Mock hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/usePosts');

describe('PostCard', () => {
  const mockPost = {
    id: 'post-123',
    content: 'This is a test post with @mention and #hashtag',
    author: {
      id: 'user-123',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    likes: 5,
    comments: 3,
    isLiked: false,
    mediaUrls: [],
  };

  const mockCurrentUser = {
    id: 'current-user',
    name: 'Current User',
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockCurrentUser,
    });

    (useLikePost as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
    });

    (useDeletePost as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render post content', () => {
      render(<PostCard post={mockPost} />);

      expect(screen.getByText(mockPost.content)).toBeInTheDocument();
    });

    it('should render author information', () => {
      render(<PostCard post={mockPost} />);

      expect(screen.getByText(mockPost.author.name)).toBeInTheDocument();
      expect(screen.getByAltText(mockPost.author.name)).toHaveAttribute(
        'src',
        mockPost.author.avatar
      );
    });

    it('should render formatted timestamp', () => {
      render(<PostCard post={mockPost} />);

      // Should show relative time like "2 hours ago"
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it('should render like and comment counts', () => {
      render(<PostCard post={mockPost} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // Likes
      expect(screen.getByText('3')).toBeInTheDocument(); // Comments
    });

    it('should highlight mentions', () => {
      render(<PostCard post={mockPost} />);

      const mention = screen.getByText('@mention');
      expect(mention).toHaveClass('mention');
      expect(mention).toHaveAttribute('href', '/users/mention');
    });

    it('should highlight hashtags', () => {
      render(<PostCard post={mockPost} />);

      const hashtag = screen.getByText('#hashtag');
      expect(hashtag).toHaveClass('hashtag');
      expect(hashtag).toHaveAttribute('href', '/search?q=%23hashtag');
    });

    it('should render media if present', () => {
      const postWithMedia = {
        ...mockPost,
        mediaUrls: ['https://example.com/image.jpg'],
      };

      render(<PostCard post={postWithMedia} />);

      const image = screen.getByRole('img', { name: /post image/i });
      expect(image).toHaveAttribute('src', postWithMedia.mediaUrls[0]);
    });

    it('should show edit indicator if post was edited', () => {
      const editedPost = {
        ...mockPost,
        isEdited: true,
        editedAt: new Date('2024-01-15T11:00:00Z'),
      };

      render(<PostCard post={editedPost} />);

      expect(screen.getByText(/edited/i)).toBeInTheDocument();
    });
  });

  describe('Like Functionality', () => {
    it('should call like mutation when like button is clicked', async () => {
      const likeMutate = jest.fn();
      (useLikePost as jest.Mock).mockReturnValue({
        mutate: likeMutate,
        isLoading: false,
      });

      render(<PostCard post={mockPost} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(likeMutate).toHaveBeenCalledWith(mockPost.id);
      });
    });

    it('should show liked state when post is liked', () => {
      const likedPost = { ...mockPost, isLiked: true };

      render(<PostCard post={likedPost} />);

      const likeButton = screen.getByRole('button', { name: /unlike/i });
      expect(likeButton).toHaveClass('liked');
    });

    it('should disable like button while loading', () => {
      (useLikePost as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: true,
      });

      render(<PostCard post={mockPost} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      expect(likeButton).toBeDisabled();
    });

    it('should update like count optimistically', async () => {
      const { rerender } = render(<PostCard post={mockPost} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);

      // Optimistic update should show increased count immediately
      expect(screen.getByText('6')).toBeInTheDocument();

      // Rerender with updated data
      rerender(<PostCard post={{ ...mockPost, likes: 6, isLiked: true }} />);

      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  describe('Comment Functionality', () => {
    it('should toggle comments section when comment button is clicked', async () => {
      render(<PostCard post={mockPost} />);

      const commentButton = screen.getByRole('button', { name: /comment/i });

      // Comments should not be visible initially
      expect(screen.queryByRole('textbox', { name: /write a comment/i })).not.toBeInTheDocument();

      // Click to show comments
      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /write a comment/i })).toBeInTheDocument();
      });
    });

    it('should submit comment when form is submitted', async () => {
      const user = userEvent.setup();
      const submitComment = jest.fn();

      render(<PostCard post={mockPost} onCommentSubmit={submitComment} />);

      // Open comments section
      const commentButton = screen.getByRole('button', { name: /comment/i });
      fireEvent.click(commentButton);

      // Type comment
      const commentInput = await screen.findByRole('textbox', { name: /write a comment/i });
      await user.type(commentInput, 'This is a test comment');

      // Submit
      const submitButton = screen.getByRole('button', { name: /post comment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitComment).toHaveBeenCalledWith({
          postId: mockPost.id,
          content: 'This is a test comment',
        });
      });
    });
  });

  describe('Menu Actions', () => {
    it('should show menu button for own posts', () => {
      const ownPost = {
        ...mockPost,
        author: { ...mockPost.author, id: mockCurrentUser.id },
      };

      render(<PostCard post={ownPost} />);

      const menuButton = screen.getByRole('button', { name: /more options/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should show edit and delete options in menu', async () => {
      const ownPost = {
        ...mockPost,
        author: { ...mockPost.author, id: mockCurrentUser.id },
      };

      render(<PostCard post={ownPost} />);

      const menuButton = screen.getByRole('button', { name: /more options/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should show report option for other users posts', async () => {
      render(<PostCard post={mockPost} />);

      const menuButton = screen.getByRole('button', { name: /more options/i });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Report')).toBeInTheDocument();
      });
    });

    it('should call delete mutation when delete is confirmed', async () => {
      const deleteMutate = jest.fn();
      (useDeletePost as jest.Mock).mockReturnValue({
        mutate: deleteMutate,
        isLoading: false,
      });

      const ownPost = {
        ...mockPost,
        author: { ...mockPost.author, id: mockCurrentUser.id },
      };

      render(<PostCard post={ownPost} />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /more options/i });
      fireEvent.click(menuButton);

      // Click delete
      const deleteButton = await screen.findByText('Delete');
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteMutate).toHaveBeenCalledWith(mockPost.id);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PostCard post={mockPost} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /like/i })).toHaveAttribute(
        'aria-label',
        'Like this post'
      );
      expect(screen.getByRole('button', { name: /comment/i })).toHaveAttribute(
        'aria-label',
        'Comment on this post'
      );
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<PostCard post={mockPost} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('link', { name: mockPost.author.name })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /like/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /comment/i })).toHaveFocus();
    });

    it('should announce like action to screen readers', async () => {
      render(<PostCard post={mockPost} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Post liked');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when like fails', async () => {
      const likeMutate = jest.fn().mockRejectedValue(new Error('Network error'));
      (useLikePost as jest.Mock).mockReturnValue({
        mutate: likeMutate,
        isLoading: false,
        error: new Error('Network error'),
      });

      render(<PostCard post={mockPost} />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to like post/i)).toBeInTheDocument();
      });
    });

    it('should show error message when delete fails', async () => {
      const deleteMutate = jest.fn().mockRejectedValue(new Error('Unauthorized'));
      (useDeletePost as jest.Mock).mockReturnValue({
        mutate: deleteMutate,
        isLoading: false,
        error: new Error('Unauthorized'),
      });

      const ownPost = {
        ...mockPost,
        author: { ...mockPost.author, id: mockCurrentUser.id },
      };

      render(<PostCard post={ownPost} />);

      // Try to delete
      const menuButton = screen.getByRole('button', { name: /more options/i });
      fireEvent.click(menuButton);

      const deleteButton = await screen.findByText('Delete');
      fireEvent.click(deleteButton);

      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete post/i)).toBeInTheDocument();
      });
    });
  });
});
