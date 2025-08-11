import { createCategory, updateCategory, deleteCategory, getCategories, getCategory } from '../actions'
import { Category } from '@/types/category'

// Mock Supabase server
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(),
      })),
      order: jest.fn(),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock schema
jest.mock('@/schemas/category.schema', () => ({
  CategorySchema: {
    safeParse: jest.fn(),
  },
}))

describe('actions/dashboard/category/actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCategory', () => {
    const mockCategory: Category = {
      name: 'Test Category',
      description: 'Test Description',
      active: true,
    }

    it('should create category successfully', async () => {
      const mockParsedData = { name: 'Test Category', description: 'Test Description', active: true }
      const mockInsertedData = { id: '1', ...mockParsedData }

      // Mock schema validation success
      const { CategorySchema } = require('@/schemas/category.schema')
      CategorySchema.safeParse.mockReturnValue({
        success: true,
        data: mockParsedData,
      })

      // Mock database operations
      const mockSingle = jest.fn().mockResolvedValue({ data: mockInsertedData, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

      const result = await createCategory(mockCategory)

      expect(CategorySchema.safeParse).toHaveBeenCalledWith(mockCategory)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('category')
      expect(mockInsert).toHaveBeenCalledWith([mockParsedData])
      expect(result).toEqual({ data: mockInsertedData, error: null })
    })

    it('should handle schema validation errors', async () => {
      const { CategorySchema } = require('@/schemas/category.schema')
      CategorySchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['name'], message: 'Name is required' },
            { path: ['active'], message: 'Active must be boolean' },
          ],
        },
      })

      const result = await createCategory(mockCategory)

      expect(result.error).toEqual({
        fieldErrors: {
          name: 'Name is required',
          active: 'Active must be boolean',
        },
      })
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { CategorySchema } = require('@/schemas/category.schema')
      CategorySchema.safeParse.mockReturnValue({
        success: true,
        data: mockCategory,
      })

      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

      const result = await createCategory(mockCategory)

      expect(result).toEqual({ 
        data: null, 
        error: { message: 'Database error' } 
      })
    })

    it('should handle schema issues without path', async () => {
      const { CategorySchema } = require('@/schemas/category.schema')
      CategorySchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: [], message: 'General error' },
            { path: ['name'], message: 'Name is required' },
          ],
        },
      })

      const result = await createCategory(mockCategory)

      expect(result.error.fieldErrors).toEqual({
        name: 'Name is required',
      })
    })
  })

  describe('updateCategory', () => {
    const mockId = '123'
    const mockCategory: Category = {
      name: 'Updated Category',
      description: 'Updated Description',
      active: false,
    }

    it('should update category successfully', async () => {
      const mockParsedData = { name: 'Updated Category', description: 'Updated Description', active: false }
      const mockUpdatedData = { id: mockId, ...mockParsedData }

      const { CategorySchema } = require('@/schemas/category.schema')
      CategorySchema.safeParse.mockReturnValue({
        success: true,
        data: mockParsedData,
      })

      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedData, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({ update: mockUpdate })

      const result = await updateCategory(mockId, mockCategory)

      expect(CategorySchema.safeParse).toHaveBeenCalledWith(mockCategory)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('category')
      expect(mockUpdate).toHaveBeenCalledWith(mockParsedData)
      expect(mockEq).toHaveBeenCalledWith('id', mockId)
      expect(result).toEqual({ data: mockUpdatedData, error: null })
    })

    it('should handle validation errors on update', async () => {
      const { CategorySchema } = require('@/schemas/category.schema')
      CategorySchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [{ path: ['name'], message: 'Name is required' }],
        },
      })

      const result = await updateCategory(mockId, mockCategory)

      expect(result.error).toEqual({
        fieldErrors: { name: 'Name is required' },
      })
    })
  })

  describe('deleteCategory', () => {
    const mockId = '123'

    it('should delete category successfully', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteCategory(mockId)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('category')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', mockId)
      expect(result).toEqual({ error: null })
    })

    it('should handle database errors on delete', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteCategory(mockId)

      expect(result).toEqual({ error: { message: 'Delete failed' } })
    })
  })

  describe('getCategories', () => {
    it('should fetch all categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', active: true },
        { id: '2', name: 'Category 2', active: false },
      ]

      const mockOrder = jest.fn().mockResolvedValue({ data: mockCategories, error: null })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder })
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await getCategories()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('category')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('name')
      expect(result).toEqual({ data: mockCategories, error: null })
    })

    it('should handle database errors when fetching categories', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder })
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await getCategories()

      expect(result).toEqual({ data: null, error: { message: 'Fetch failed' } })
    })
  })

  describe('getCategory', () => {
    const mockId = '123'

    it('should fetch single category successfully', async () => {
      const mockCategory = { id: mockId, name: 'Test Category', active: true }

      const mockSingle = jest.fn().mockResolvedValue({ data: mockCategory, error: null })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await getCategory(mockId)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('category')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', mockId)
      expect(result).toEqual({ data: mockCategory, error: null })
    })

    it('should handle not found category', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await getCategory(mockId)

      expect(result).toEqual({ data: null, error: { message: 'Not found' } })
    })
  })
})