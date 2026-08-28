import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies the correct custom classes', () => {
    render(<Button className="custom-test">Test</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('custom-test');
    // Verify it retains base classes
    expect(btn).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('handles click events', () => {
    const onClickMock = jest.fn();
    render(<Button onClick={onClickMock}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
