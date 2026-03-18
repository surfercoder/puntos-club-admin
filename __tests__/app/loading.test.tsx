import { render } from '@testing-library/react';
import Loading from '@/app/loading';

describe('Loading page', () => {
  it('renders a spinner', () => {
    render(<Loading />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
