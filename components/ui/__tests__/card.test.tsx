import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default props', () => {
      render(<Card>Card content</Card>);
      
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card.tagName).toBe('DIV');
    });

    it('should apply default CSS classes', () => {
      render(<Card data-testid="card">Card content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-sm');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('text-black');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should merge custom className with default classes', () => {
      render(
        <Card className="bg-blue-100 custom-class" data-testid="card">
          Card content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-blue-100');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-sm'); // Default class still present
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card with ref</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should accept and forward HTML div attributes', () => {
      render(
        <Card
          id="test-card"
          data-testid="custom-card"
          role="article"
          aria-label="Product card"
          onClick={() => {}}
        >
          Clickable card
        </Card>
      );
      
      const card = screen.getByTestId('custom-card');
      expect(card).toHaveAttribute('id', 'test-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Product card');
    });

    it('should render without children', () => {
      render(<Card data-testid="empty-card" />);
      
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('');
    });
  });

  describe('CardHeader', () => {
    it('should render with default props', () => {
      render(<CardHeader>Header content</CardHeader>);
      
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('DIV');
    });

    it('should apply default CSS classes', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>);
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });

    it('should merge custom className with default classes', () => {
      render(
        <CardHeader className="bg-gray-100 custom-header" data-testid="header">
          Custom header
        </CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('bg-gray-100');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex'); // Default class
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header with ref</CardHeader>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render with default props', () => {
      render(<CardTitle>Title text</CardTitle>);
      
      const title = screen.getByText('Title text');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('DIV');
    });

    it('should apply default CSS classes', () => {
      render(<CardTitle data-testid="title">Title text</CardTitle>);
      
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
      expect(title).toHaveClass('text-black');
    });

    it('should merge custom className', () => {
      render(
        <CardTitle className="text-2xl text-blue-600" data-testid="title">
          Large blue title
        </CardTitle>
      );
      
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('text-blue-600');
      expect(title).toHaveClass('font-semibold'); // Default class
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardTitle ref={ref}>Title with ref</CardTitle>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardDescription', () => {
    it('should render with default props', () => {
      render(<CardDescription>Description text</CardDescription>);
      
      const description = screen.getByText('Description text');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('DIV');
    });

    it('should apply default CSS classes', () => {
      render(<CardDescription data-testid="description">Description text</CardDescription>);
      
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-neutral-500');
    });

    it('should merge custom className', () => {
      render(
        <CardDescription className="text-lg text-gray-700" data-testid="description">
          Larger description
        </CardDescription>
      );
      
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-lg');
      expect(description).toHaveClass('text-gray-700');
      // Default class text-sm is overridden by tailwind-merge with text-lg
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardDescription ref={ref}>Description with ref</CardDescription>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardContent', () => {
    it('should render with default props', () => {
      render(<CardContent>Content text</CardContent>);
      
      const content = screen.getByText('Content text');
      expect(content).toBeInTheDocument();
      expect(content.tagName).toBe('DIV');
    });

    it('should apply default CSS classes', () => {
      render(<CardContent data-testid="content">Content text</CardContent>);
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('should merge custom className', () => {
      render(
        <CardContent className="p-4 bg-gray-50" data-testid="content">
          Custom content
        </CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-4');
      expect(content).toHaveClass('bg-gray-50');
      // Default class pt-0 is overridden by tailwind-merge with p-4
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content with ref</CardContent>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('should render with default props', () => {
      render(<CardFooter>Footer content</CardFooter>);
      
      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('DIV');
    });

    it('should apply default CSS classes', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>);
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('should merge custom className', () => {
      render(
        <CardFooter className="justify-end bg-gray-100" data-testid="footer">
          Right-aligned footer
        </CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('justify-end');
      expect(footer).toHaveClass('bg-gray-100');
      expect(footer).toHaveClass('flex'); // Default class
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer with ref</CardFooter>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Full card composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Product Card</CardTitle>
            <CardDescription>This is a product description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
            <p>Additional content</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );
      
      // Check all parts are rendered
      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByText('Product Card')).toBeInTheDocument();
      expect(screen.getByText('This is a product description')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByText('Additional content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('should maintain proper hierarchy and styling when composed', () => {
      render(
        <Card className="max-w-md" data-testid="composed-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Centered Title</CardTitle>
            <CardDescription>Subtitle text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>Content block 1</div>
            <div>Content block 2</div>
          </CardContent>
          <CardFooter className="justify-between">
            <button>Cancel</button>
            <button>Save</button>
          </CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('composed-card');
      expect(card).toHaveClass('max-w-md');
      
      const header = screen.getByText('Centered Title').parentElement;
      expect(header).toHaveClass('text-center');
      
      const title = screen.getByText('Centered Title');
      expect(title).toHaveClass('text-xl');
      
      const content = screen.getByText('Content block 1').parentElement;
      expect(content).toHaveClass('space-y-4');
      
      const footer = screen.getByRole('button', { name: 'Cancel' }).parentElement;
      expect(footer).toHaveClass('justify-between');
    });
  });

  describe('accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card
          role="article"
          aria-label="Product information"
          aria-describedby="product-desc"
          data-testid="accessible-card"
        >
          <CardHeader>
            <CardTitle id="product-title">iPhone 14</CardTitle>
            <CardDescription id="product-desc">Latest smartphone</CardDescription>
          </CardHeader>
          <CardContent>
            Product details
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('accessible-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Product information');
      expect(card).toHaveAttribute('aria-describedby', 'product-desc');
      
      const title = screen.getByText('iPhone 14');
      expect(title).toHaveAttribute('id', 'product-title');
      
      const description = screen.getByText('Latest smartphone');
      expect(description).toHaveAttribute('id', 'product-desc');
    });

    it('should work with keyboard navigation when interactive', () => {
      const handleClick = jest.fn();
      
      render(
        <Card
          tabIndex={0}
          role="button"
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick();
            }
          }}
          data-testid="interactive-card"
        >
          <CardContent>Clickable card content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('interactive-card');
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('role', 'button');
      
      card.focus();
      expect(card).toHaveFocus();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty children gracefully', () => {
      render(
        <Card data-testid="card-with-empty">
          <CardHeader></CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('card-with-empty');
      expect(card).toBeInTheDocument();
    });

    it('should handle null/undefined className props', () => {
      render(
        <Card className={null as string | null} data-testid="null-class">
          <CardTitle className={undefined}>Title</CardTitle>
        </Card>
      );
      
      const card = screen.getByTestId('null-class');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should handle complex nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <div>Complex Title</div>
              <span>With nested elements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
              <div>
                <p>Nested paragraph</p>
                <button>Nested button</button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Complex Title')).toBeInTheDocument();
      expect(screen.getByText('With nested elements')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Nested button' })).toBeInTheDocument();
    });

    it('should handle long text content without breaking layout', () => {
      const longText = 'This is a very long text content that should be handled gracefully by the card component without breaking the layout or causing any overflow issues. '.repeat(10);
      
      render(
        <Card data-testid="long-content-card">
          <CardContent>{longText}</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('long-content-card');
      expect(card).toBeInTheDocument();
      const content = screen.getByTestId('long-content-card').querySelector('.p-6');
      expect(content?.textContent).toBe(longText);
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'';
      const unicodeContent = '🚀 Unicode: 世界 العالم мир';
      
      render(
        <Card>
          <CardTitle>{specialContent}</CardTitle>
          <CardDescription>{unicodeContent}</CardDescription>
        </Card>
      );
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
      expect(screen.getByText(unicodeContent)).toBeInTheDocument();
    });
  });

  describe('CSS class merging behavior', () => {
    it('should properly merge conflicting Tailwind classes', () => {
      render(
        <Card className="bg-red-500 bg-blue-500" data-testid="conflicting-bg">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('conflicting-bg');
      // tailwind-merge should resolve conflicts, keeping the last one
      expect(card).toHaveClass('bg-blue-500');
    });

    it('should handle complex class combinations', () => {
      render(
        <Card 
          className="p-8 m-4 hover:shadow-lg transition-shadow duration-300 ease-in-out"
          data-testid="complex-classes"
        >
          <CardHeader className="pb-2 border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-primary">
              Complex Styled Card
            </CardTitle>
          </CardHeader>
        </Card>
      );
      
      const card = screen.getByTestId('complex-classes');
      expect(card).toHaveClass('p-8');
      expect(card).toHaveClass('m-4');
      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveClass('transition-shadow');
    });
  });
});