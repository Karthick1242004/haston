import type { CategoryFilter } from "@/types/product"

// Define the category structure
export const CATEGORIES: CategoryFilter[] = [
  {
    id: "men",
    name: "Men",
    value: "men",
    subcategories: [
      {
        id: "men-regular",
        name: "Regular Tees",
        value: "regular"
      },
      {
        id: "men-oversized",
        name: "Oversized Tees",
        value: "oversized-tees"
      }
    ]
  },
  {
    id: "women",
    name: "Women",
    value: "women",
    subcategories: [
      {
        id: "women-regular",
        name: "Regular Tees",
        value: "regular"
      },
      {
        id: "women-oversized",
        name: "Oversized Tees",
        value: "oversized-tees"
      },
      {
        id: "women-tank-tops",
        name: "Tank Tops",
        value: "tank-tops"
      }
    ]
  }
]

// Helper function to get all subcategories for a main category
export const getSubcategoriesForCategory = (mainCategory: string): string[] => {
  const category = CATEGORIES.find(cat => cat.value === mainCategory)
  return category?.subcategories?.map(sub => sub.value) || []
}

// Helper function to get category display name
export const getCategoryDisplayName = (mainCategory: string, subCategory?: string): string => {
  const category = CATEGORIES.find(cat => cat.value === mainCategory)
  if (!category) return mainCategory
  
  if (!subCategory) return category.name
  
  const subcategory = category.subcategories?.find(sub => sub.value === subCategory)
  return subcategory ? `${category.name} - ${subcategory.name}` : `${category.name} - ${subCategory}`
}

// Helper function to validate category combination
export const isValidCategoryCombo = (mainCategory: string, subCategory: string): boolean => {
  const category = CATEGORIES.find(cat => cat.value === mainCategory)
  if (!category) return false
  
  return category.subcategories?.some(sub => sub.value === subCategory) || false
}

// Get all main categories
export const getMainCategories = (): CategoryFilter[] => {
  return CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    value: cat.value
  }))
}

// Get all subcategories flattened with their parent info
export const getAllSubcategories = () => {
  const allSubs: Array<{
    id: string
    name: string
    value: string
    parentCategory: string
    parentCategoryName: string
  }> = []
  
  CATEGORIES.forEach(cat => {
    cat.subcategories?.forEach(sub => {
      allSubs.push({
        ...sub,
        parentCategory: cat.value,
        parentCategoryName: cat.name
      })
    })
  })
  
  return allSubs
}