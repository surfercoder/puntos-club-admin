import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('should render checkbox', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should handle checked state', () => {
    render(<Checkbox defaultChecked />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should handle unchecked state', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should call onCheckedChange when clicked', () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Checkbox className="custom-class" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('should pass through additional props', () => {
    render(<Checkbox data-testid="checkbox-test" id="test-checkbox" />);
    
    const checkbox = screen.getByTestId('checkbox-test');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('id', 'test-checkbox');
  });

  it('should render check icon when checked', () => {
    render(<Checkbox defaultChecked />);
    
    const checkbox = screen.getByRole('checkbox');
    const checkIcon = checkbox.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
  });
});