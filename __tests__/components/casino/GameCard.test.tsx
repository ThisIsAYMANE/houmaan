/**
 * GameCard Component Tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import GameCard from '@/components/games/GameCard'

const mockGame = {
  id: 'game-1',
  name: 'Test Game',
  provider: 'Test Provider',
  category: 'slots',
  thumbnail: '/test-thumbnail.jpg',
  is_featured: true,
  is_favorite: false,
}

describe('GameCard', () => {
  it('should render game information', () => {
    render(<GameCard game={mockGame} />)

    expect(screen.getByText('Test Game')).toBeInTheDocument()
    expect(screen.getByText('Test Provider')).toBeInTheDocument()
  })

  it('should show favorite icon when game is favorite', () => {
    const favoriteGame = { ...mockGame, is_favorite: true }
    render(<GameCard game={favoriteGame} />)

    // Check for favorite icon (you may need to adjust based on actual implementation)
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    expect(favoriteButton).toBeInTheDocument()
  })

  it('should call onPlay when play button is clicked', () => {
    const onPlay = jest.fn()
    render(<GameCard game={mockGame} onPlay={onPlay} />)

    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)

    expect(onPlay).toHaveBeenCalledWith(mockGame.id)
  })

  it('should show featured badge when game is featured', () => {
    render(<GameCard game={mockGame} />)

    // Check for featured badge (adjust based on actual implementation)
    expect(screen.getByText(/featured/i)).toBeInTheDocument()
  })
})





