/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react';

import { Button, buttonVariants } from '../button'

describe('components/ui/button', () => {
  describe('Button component', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('should handle onClick events', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button', { name: /click me/i })
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', async () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled button</Button>)
      
      const button = screen.getByRole('button', { name: /disabled button/i })
      expect(button).toBeDisabled()
      
      await userEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should apply default variant styles', () => {
      render(<Button>Default variant</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should apply destructive variant styles', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white')
    })

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-200', 'text-black')
    })

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-gray-100', 'hover:text-black')
    })

    it('should apply link variant styles', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-blue-600', 'underline-offset-4')
    })

    it('should apply small size styles', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'rounded-md', 'px-3')
    })

    it('should apply large size styles', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'rounded-md', 'px-8')
    })

    it('should apply icon size styles', () => {
      render(<Button size="icon">🔍</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'w-9')
    })

    it('should forward ref correctly', () => {
      const ref = jest.fn()
      render(<Button ref={ref}>Ref test</Button>)
      expect(ref).toHaveBeenCalled()
    })

    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should accept custom props', () => {
      render(<Button data-testid="custom-button" type="submit">Submit</Button>)
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should work as a child element with asChild', () => {
      render(
        <Button asChild>
          <a href="/test">Link button</a>
        </Button>
      )
      const link = screen.getByRole('link', { name: /link button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })

    it('should combine variant and size classes correctly', () => {
      render(<Button size="sm" variant="outline">Combined</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white', 'h-8', 'px-3')
    })

    it('should handle keyboard events', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Keyboard test</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      await userEvent.keyboard('{Enter}')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle space key press', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Space test</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      await userEvent.keyboard('{ }')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not trigger onClick when disabled and clicked', async () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled test</Button>)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should support multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('should have correct accessibility attributes', () => {
      render(<Button aria-label="Accessible button">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Accessible button')
    })
  })

  describe('buttonVariants function', () => {
    it('should return default classes with no parameters', () => {
      const classes = buttonVariants()
      expect(classes).toContain('inline-flex')
      expect(classes).toContain('items-center')
      expect(classes).toContain('justify-center')
      expect(classes).toContain('bg-blue-600')
      expect(classes).toContain('text-white')
    })

    it('should return destructive variant classes', () => {
      const classes = buttonVariants({ variant: 'destructive' })
      expect(classes).toContain('bg-red-600')
      expect(classes).toContain('text-white')
    })

    it('should return outline variant classes', () => {
      const classes = buttonVariants({ variant: 'outline' })
      expect(classes).toContain('border')
      expect(classes).toContain('border-gray-300')
      expect(classes).toContain('bg-white')
    })

    it('should return secondary variant classes', () => {
      const classes = buttonVariants({ variant: 'secondary' })
      expect(classes).toContain('bg-gray-200')
      expect(classes).toContain('text-black')
    })

    it('should return ghost variant classes', () => {
      const classes = buttonVariants({ variant: 'ghost' })
      expect(classes).toContain('hover:bg-gray-100')
      expect(classes).toContain('hover:text-black')
    })

    it('should return link variant classes', () => {
      const classes = buttonVariants({ variant: 'link' })
      expect(classes).toContain('text-blue-600')
      expect(classes).toContain('underline-offset-4')
    })

    it('should return small size classes', () => {
      const classes = buttonVariants({ size: 'sm' })
      expect(classes).toContain('h-8')
      expect(classes).toContain('px-3')
    })

    it('should return large size classes', () => {
      const classes = buttonVariants({ size: 'lg' })
      expect(classes).toContain('h-10')
      expect(classes).toContain('px-8')
    })

    it('should return icon size classes', () => {
      const classes = buttonVariants({ size: 'icon' })
      expect(classes).toContain('h-9')
      expect(classes).toContain('w-9')
    })

    it('should combine variant and size classes', () => {
      const classes = buttonVariants({ variant: 'outline', size: 'sm' })
      expect(classes).toContain('border')
      expect(classes).toContain('h-8')
      expect(classes).toContain('px-3')
    })

    it('should accept custom className', () => {
      const classes = buttonVariants({ className: 'custom-class' })
      expect(classes).toContain('custom-class')
    })
  })
})