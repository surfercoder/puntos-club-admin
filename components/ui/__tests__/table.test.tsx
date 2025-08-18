import React from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../table';

describe('Table Components', () => {
  describe('Table', () => {
    it('should render table element', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Test</td>
            </tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('w-full');
    });

    it('should apply custom className to table', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr>
              <td>Test</td>
            </tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });
  });

  describe('TableHeader', () => {
    it('should render thead element', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );
      
      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toBeInTheDocument();
    });

    it('should apply custom className to thead', () => {
      render(
        <table>
          <TableHeader className="custom-header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );
      
      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toHaveClass('custom-header');
    });
  });

  describe('TableBody', () => {
    it('should render tbody element', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Body</td>
            </tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByText('Body').closest('tbody');
      expect(tbody).toBeInTheDocument();
    });

    it('should apply custom className to tbody', () => {
      render(
        <table>
          <TableBody className="custom-body">
            <tr>
              <td>Body</td>
            </tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByText('Body').closest('tbody');
      expect(tbody).toHaveClass('custom-body');
    });
  });

  describe('TableRow', () => {
    it('should render tr element', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Row</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByText('Row').closest('tr');
      expect(row).toBeInTheDocument();
      expect(row).toHaveClass('border-b');
    });

    it('should apply custom className to tr', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row">
              <td>Row</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByText('Row').closest('tr');
      expect(row).toHaveClass('custom-row');
    });
  });

  describe('TableHead', () => {
    it('should render th element', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Header Cell</TableHead>
            </tr>
          </thead>
        </table>
      );
      
      const headerCell = screen.getByRole('columnheader');
      expect(headerCell).toBeInTheDocument();
      expect(headerCell).toHaveTextContent('Header Cell');
      expect(headerCell).toHaveClass('h-12');
    });

    it('should apply custom className to th', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head">Header Cell</TableHead>
            </tr>
          </thead>
        </table>
      );
      
      const headerCell = screen.getByRole('columnheader');
      expect(headerCell).toHaveClass('custom-head');
    });
  });

  describe('TableCell', () => {
    it('should render td element', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Data Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByRole('cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveTextContent('Data Cell');
      expect(cell).toHaveClass('p-4');
    });

    it('should apply custom className to td', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Data Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('custom-cell');
    });
  });

  describe('Complete Table', () => {
    it('should render complete table structure', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
              <TableCell>25</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane</TableCell>
              <TableCell>30</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'John' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '25' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Jane' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '30' })).toBeInTheDocument();
    });
  });
});