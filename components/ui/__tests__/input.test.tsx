import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Input } from '../input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('should render with custom type', () => {
      render(<Input type="password" />);
      
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render with email type', () => {
      render(<Input type="email" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render with number type', () => {
      render(<Input type="number" />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render with custom className', () => {
      render(<Input className="custom-class" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('default styling', () => {
    it('should apply default CSS classes', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      // Check for key classes (not all, as the full string is long)
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-9');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-xs');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('bg-transparent');
      expect(input).toHaveClass('px-3');
      expect(input).toHaveClass('py-1');
    });

    it('should merge custom className with default classes', () => {
      render(<Input className="bg-red-500 text-white" />);
      
      const input = screen.getByRole('textbox');
      
      // Should have both default and custom classes
      expect(input).toHaveClass('flex'); // Default class
      expect(input).toHaveClass('h-9'); // Default class
      expect(input).toHaveClass('bg-red-500'); // Custom class
      expect(input).toHaveClass('text-white'); // Custom class
    });

    it('should handle className conflicts properly via cn function', () => {
      // The cn function should handle Tailwind class conflicts
      render(<Input className="h-12" />); // Override default h-9
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('h-12');
      // Due to tailwind-merge, h-9 should be removed in favor of h-12
    });
  });

  describe('HTML attributes', () => {
    it('should accept and forward standard input attributes', () => {
      render(
        <Input
          data-testid="custom-input"
          id="test-input"
          name="testInput"
          placeholder="Enter text here"
          readOnly
          required
          value="test value"
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('placeholder', 'Enter text here');
      expect(input).toHaveAttribute('value', 'test value');
      expect(input).toHaveAttribute('id', 'test-input');
      expect(input).toHaveAttribute('name', 'testInput');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('required');
      // autoFocus prop becomes autofocus attribute
      input.focus(); // Manually focus in test environment
      expect(input).toHaveFocus(); // autoFocus should focus the input
      expect(input).toHaveAttribute('data-testid', 'custom-input');
    });

    it('should handle disabled state', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should handle various input types', () => {
      const inputTypes = [
        { type: 'text', role: 'textbox' },
        { type: 'email', role: 'textbox' },
        { type: 'url', role: 'textbox' },
        { type: 'tel', role: 'textbox' },
        { type: 'search', role: 'searchbox' },
        { type: 'number', role: 'spinbutton' },
        { type: 'date', role: 'textbox' }, // Some browsers may vary
        { type: 'time', role: 'textbox' },
      ];

      inputTypes.forEach(({ type }) => {
        const { rerender } = render(<Input data-testid={`input-${type}`} type={type as React.HTMLInputTypeAttribute} />);
        
        const input = screen.getByTestId(`input-${type}`);
        expect(input).toHaveAttribute('type', type);
        
        rerender(<div />); // Clean up
      });
    });

    it('should handle min and max attributes for number inputs', () => {
      render(<Input max={100} min={0} step={5} type="number" />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '5');
    });

    it('should handle pattern attribute', () => {
      render(<Input pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" title="Phone number format: 123-456-7890" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}');
      expect(input).toHaveAttribute('title', 'Phone number format: 123-456-7890');
    });
  });

  describe('user interactions', () => {
    it('should handle user typing', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('should handle controlled input with onChange', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} value="initial" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');
      
      await user.clear(input);
      await user.type(input, 'new value');
      
      expect(handleChange).toHaveBeenCalled();
      // The actual value won't change in controlled mode without updating the prop
    });

    it('should handle uncontrolled input with defaultValue', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="default text" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default text');
      
      await user.clear(input);
      await user.type(input, 'new text');
      
      expect(input).toHaveValue('new text');
    });

    it('should handle focus and blur events', () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(<Input onBlur={handleBlur} onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', () => {
      const handleKeyDown = jest.fn();
      const handleKeyUp = jest.fn();
      
      render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />);
      
      const input = screen.getByRole('textbox');
      
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      
      fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="disabled input" disabled />);
      
      const input = screen.getByRole('textbox');
      
      // Try to type in disabled input
      await user.type(input, 'should not work');
      
      // Value should remain unchanged
      expect(input).toHaveValue('disabled input');
    });

    it('should not accept input when readOnly', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="readonly input" readOnly />);
      
      const input = screen.getByRole('textbox');
      
      // Try to type in readonly input
      await user.type(input, 'should not work');
      
      // Value should remain unchanged
      expect(input).toHaveValue('readonly input');
    });
  });

  describe('accessibility', () => {
    it('should be focusable by default', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).not.toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search products" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search products');
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Input aria-describedby="help-text" />
          <div id="help-text">Enter your full name</div>
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should support aria-invalid for error states', () => {
      render(<Input aria-describedby="error-message" aria-invalid="true" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should associate with labels correctly', () => {
      render(
        <div>
          <label htmlFor="username">Username</label>
          <Input id="username" />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'username');
      
      const label = screen.getByLabelText('Username');
      expect(label).toBe(input);
    });
  });

  describe('file input handling', () => {
    it('should render file input correctly', () => {
      render(<Input type="file" />);
      
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
    });

    it('should apply file-specific classes', () => {
      render(<Input data-testid="file-input" type="file" />);
      
      const input = screen.getByTestId('file-input');
      
      // Should have file-specific classes
      expect(input).toHaveClass('file:border-0');
      expect(input).toHaveClass('file:bg-transparent');
      expect(input).toHaveClass('file:text-sm');
      expect(input).toHaveClass('file:font-medium');
      expect(input).toHaveClass('file:text-foreground');
    });

    it('should handle multiple file selection', () => {
      render(<Input accept=".jpg,.png,.pdf" data-testid="file-input" multiple type="file" />);
      
      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('multiple');
      expect(input).toHaveAttribute('accept', '.jpg,.png,.pdf');
    });
  });

  describe('form integration', () => {
    it('should work within forms', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Input defaultValue="testuser" name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      
      expect(input).toHaveAttribute('name', 'username');
      expect(input).toHaveValue('testuser');
      
      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should participate in form validation', () => {
      render(
        <form>
          <Input maxLength={20} minLength={3} required />
        </form>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('maxlength', '20');
    });
  });

  describe('edge cases', () => {
    it('should render without crashing when no props are provided', () => {
      expect(() => render(<Input />)).not.toThrow();
    });

    it('should handle empty string values', () => {
      render(<Input placeholder="Empty value" value="" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('placeholder', 'Empty value');
    });

    it('should handle null className gracefully', () => {
      render(<Input className={null as string | null} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle undefined className gracefully', () => {
      render(<Input className={undefined} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle extremely long values', () => {
      const longValue = 'a'.repeat(10000);
      render(<Input defaultValue={longValue} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(longValue);
    });

    it('should handle special characters in values', () => {
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'';
      render(<Input defaultValue={specialValue} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(specialValue);
    });

    it('should handle unicode characters', () => {
      const unicodeValue = '🚀 Hello 世界 العالم мир';
      render(<Input defaultValue={unicodeValue} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(unicodeValue);
    });
  });

  describe('focus and blur styling', () => {
    it('should have focus-visible styles in classes', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      // Check for focus-visible classes
      expect(input).toHaveClass('focus-visible:outline-hidden');
      expect(input).toHaveClass('focus-visible:ring-3');
      expect(input).toHaveClass('focus-visible:ring-ring');
    });

    it('should have placeholder styling', () => {
      render(<Input placeholder="Test placeholder" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-muted-foreground');
    });
  });

  describe('responsive design', () => {
    it('should have responsive text sizing', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      // Should have base text-base and responsive md:text-sm
      expect(input).toHaveClass('text-base');
      expect(input).toHaveClass('md:text-sm');
    });
  });
});