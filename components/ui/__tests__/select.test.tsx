import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectGroup,
} from '../select';

describe('Select Components', () => {
  describe('Select', () => {
    it('should render select trigger and open content', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
      expect(screen.getByText('Select an option')).toBeInTheDocument();

      fireEvent.click(trigger);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should handle value selection', () => {
      const onValueChange = jest.fn();
      
      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      const option1 = screen.getByText('Option 1');
      fireEvent.click(option1);

      expect(onValueChange).toHaveBeenCalledWith('option1');
    });

    it('should render with default value', () => {
      render(
        <Select defaultValue="option2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  describe('SelectTrigger', () => {
    it('should apply custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });

    it('should render chevron down icon', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      const chevronIcon = trigger.querySelector('svg');
      expect(chevronIcon).toBeInTheDocument();
    });
  });

  describe('SelectValue', () => {
    it('should display placeholder when no value is selected', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });
  });

  describe('SelectItem', () => {
    it('should render select items with check icon when selected', () => {
      render(
        <Select defaultValue="option1" defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const selectedItem = screen.getAllByText('Option 1').find(el => el.closest('[role="option"]'))?.closest('[role="option"]');
      const checkIcon = selectedItem?.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should apply custom className to select item', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      const item = screen.getByText('Option 1').closest('[role="option"]');
      expect(item).toHaveClass('custom-item');
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2" disabled>
              Option 2 (Disabled)
            </SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      const disabledItem = screen.getByText('Option 2 (Disabled)').closest('[role="option"]');
      expect(disabledItem).toHaveAttribute('data-disabled', '');
    });
  });

  describe('SelectContent', () => {
    it('should apply custom className', () => {
      render(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="custom-content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const content = screen.getByRole('listbox');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('Additional Select Components', () => {
    it('renders SelectSeparator, SelectLabel, SelectScrollUpButton and SelectScrollDownButton', () => {
      const { container } = render(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectGroup>
              <SelectLabel>Select Label</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Select Label')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('renders SelectGroup', () => {
      const { container } = render(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      expect(container).toBeInTheDocument();
    });
  });
});