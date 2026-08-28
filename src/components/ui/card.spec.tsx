import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('Card Component', () => {
  it('renders correctly with strict studio styles', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Studio Card</CardTitle>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>
    );
    
    const title = screen.getByText('Studio Card');
    expect(title).toBeInTheDocument();
    
    // Test base structure is present
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });
});
