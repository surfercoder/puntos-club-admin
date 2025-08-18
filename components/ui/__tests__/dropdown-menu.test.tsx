import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../dropdown-menu';

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('should render dropdown menu trigger and content', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      expect(trigger).toBeInTheDocument();

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render with label and separator', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Menu Label')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('should apply custom className', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger className="custom-trigger">
            Trigger
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });
  });

  describe('DropdownMenuContent', () => {
    it('should apply custom className', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content" data-testid="dropdown-content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('DropdownMenuItem', () => {
    it('should handle click events', () => {
      const onClick = jest.fn();

      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onClick}>Clickable Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByText('Clickable Item');
      fireEvent.click(item);

      expect(onClick).toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item">
              Custom Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByText('Custom Item');
      expect(item).toHaveClass('custom-item');
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByText('Disabled Item');
      expect(item).toHaveAttribute('data-disabled', '');
    });

    it('should render with inset when inset prop is true', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByText('Inset Item');
      expect(item).toHaveClass('pl-8');
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('should handle checked state', () => {
      const onCheckedChange = jest.fn();

      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem 
              checked={false} 
              onCheckedChange={onCheckedChange}
            >
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByText('Checkbox Item');
      fireEvent.click(item);

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should show check icon when checked', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByText('Checked Item');
      const checkIcon = item.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('DropdownMenuRadioGroup and DropdownMenuRadioItem', () => {
    it('should handle radio group selection', () => {
      const onValueChange = jest.fn();

      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const option2 = screen.getByText('Option 2');
      fireEvent.click(option2);

      expect(onValueChange).toHaveBeenCalledWith('option2');
    });

    it('should show circle icon for selected radio item', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Selected Option</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const selectedItem = screen.getByText('Selected Option');
      const circleIcon = selectedItem.querySelector('svg');
      expect(circleIcon).toBeInTheDocument();
    });
  });

  describe('DropdownMenuLabel', () => {
    it('should render label with correct classes', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const label = screen.getByText('Menu Label');
      expect(label).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="custom-label">
              Custom Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const label = screen.getByText('Custom Label');
      expect(label).toHaveClass('custom-label');
    });

    it('should render with inset when inset prop is true', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const label = screen.getByText('Inset Label');
      expect(label).toHaveClass('pl-8');
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('should render separator', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const separator = screen.getByTestId('separator');
      expect(separator).toBeInTheDocument();
    });

    it('should apply custom className to separator', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator className="custom-separator" data-testid="separator" />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('custom-separator');
    });
  });

  describe('DropdownMenuSub', () => {
    it('should render submenu', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Submenu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const subTrigger = screen.getByText('Submenu');
      expect(subTrigger).toBeInTheDocument();
      
      fireEvent.click(subTrigger);
      expect(screen.getByText('Sub Item')).toBeInTheDocument();
    });
  });
});