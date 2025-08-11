import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProducts, 
  getProduct 
} from '../actions';
import { createClient } from '@/lib/supabase/server';
import { ProductSchema } from '@/schemas/product.schema';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/product.schema');
const mockProductSchema = ProductSchema as jest.Mocked<typeof ProductSchema>;

describe('Product Actions', () => {
  let mockSupabaseClient: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock functions
    mockFrom = jest.fn();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockEq = jest.fn();
    mockOrder = jest.fn();
    mockSingle = jest.fn();

    // Setup mock client
    mockSupabaseClient = {
      from: mockFrom,
    };

    // Configure the client mock
    mockCreateClient.mockResolvedValue(mockSupabaseClient);

    // Setup default chain methods
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
    });

    mockOrder.mockReturnValue({
      data: [],
      error: null,
    });

    mockSingle.mockReturnValue({
      data: null,
      error: null,
    });
  });

  describe('createProduct', () => {
    const validProductInput = {
      subcategory_id: 'subcat-1',
      name: 'Test Product',
      description: 'Test description',
      required_points: 100,
      active: true,
    };

    it('should create product successfully with valid input', async () => {
      const mockData = { id: '1', ...validProductInput };
      
      // Mock schema validation success
      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validProductInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createProduct(validProductInput as any);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith(validProductInput);
      expect(mockFrom).toHaveBeenCalledWith('product');
      expect(mockInsert).toHaveBeenCalledWith([validProductInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        name: '', // Invalid: empty name
        required_points: -10, // Invalid: negative points
      };

      const mockErrors = [
        {
          path: ['subcategory_id'],
          message: 'Subcategory is required',
        },
        {
          path: ['name'],
          message: 'Name is required',
        },
        {
          path: ['required_points'],
          message: 'Points must be non-negative',
        },
      ];

      // Mock schema validation failure
      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createProduct(invalidInput as any);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            subcategory_id: 'Subcategory is required',
            name: 'Name is required',
            required_points: 'Points must be non-negative',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validProductInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createProduct(validProductInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should handle validation errors with multiple fields', async () => {
      const invalidInput = {
        name: '',
        description: 123, // Invalid type
        required_points: -5,
      };

      const mockErrors = [
        { path: ['name'], message: 'Name is required' },
        { path: ['description'], message: 'Description must be a string or null' },
        { path: ['required_points'], message: 'Points must be non-negative' },
      ];

      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createProduct(invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            description: 'Description must be a string or null',
            required_points: 'Points must be non-negative',
          },
        },
      });
    });

    it('should handle validation errors with empty path', async () => {
      const mockErrors = [
        { path: [], message: 'General validation error' },
        { path: ['name'], message: 'Name is required' },
      ];

      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createProduct({} as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
          },
        },
      });
    });
  });

  describe('updateProduct', () => {
    const productId = 'product-1';
    const validUpdateInput = {
      subcategory_id: 'subcat-2',
      name: 'Updated Product',
      description: 'Updated description',
      required_points: 150,
      active: false,
    };

    it('should update product successfully', async () => {
      const mockUpdatedData = { id: productId, ...validUpdateInput };

      // Mock schema validation success
      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateProduct(productId, validUpdateInput as any);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('product');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', productId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        name: '',
        required_points: 'invalid', // Invalid type
      };

      const mockErrors = [
        { path: ['name'], message: 'Name is required' },
        { path: ['required_points'], message: 'Points must be a number' },
      ];

      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateProduct(productId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            required_points: 'Points must be a number',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockProductSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateProduct(productId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const productId = 'product-1';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteProduct(productId);

      expect(mockFrom).toHaveBeenCalledWith('product');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', productId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const productId = 'product-1';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteProduct(productId);

      expect(result).toEqual({ error: mockDatabaseError });
    });
  });

  describe('getProducts', () => {
    it('should fetch all products successfully', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', required_points: 100, active: true },
        { id: '2', name: 'Product 2', required_points: 200, active: false },
      ];

      mockOrder.mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      const result = await getProducts();

      expect(mockFrom).toHaveBeenCalledWith('product');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(result).toEqual({ data: mockProducts, error: null });
    });

    it('should handle database errors when fetching products', async () => {
      const mockDatabaseError = { message: 'Fetch failed' };

      mockOrder.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getProducts();

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should return empty array when no products exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getProducts();

      expect(result).toEqual({ data: [], error: null });
    });
  });

  describe('getProduct', () => {
    it('should fetch single product successfully', async () => {
      const productId = 'product-1';
      const mockProduct = { 
        id: productId, 
        name: 'Test Product', 
        subcategory_id: 'subcat-1',
        required_points: 100,
        active: true 
      };

      mockSingle.mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      const result = await getProduct(productId);

      expect(mockFrom).toHaveBeenCalledWith('product');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', productId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockProduct, error: null });
    });

    it('should handle product not found', async () => {
      const productId = 'non-existent';

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Product not found' },
      });

      const result = await getProduct(productId);

      expect(result).toEqual({ data: null, error: { message: 'Product not found' } });
    });

    it('should handle database errors when fetching single product', async () => {
      const productId = 'product-1';
      const mockDatabaseError = { message: 'Database connection failed' };

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getProduct(productId);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });
});