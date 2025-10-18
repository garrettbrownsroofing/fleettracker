// Simple storage service that works without authentication
// This will store data in a way that persists across refreshes

export class SimpleStorage {
  private static storageKey = 'fleet-tracker-data'

  static async save(collection: string, data: any[]): Promise<void> {
    try {
      // For now, we'll use a simple approach
      // In production, this could be replaced with a real database
      const allData = this.getAllData()
      allData[collection] = data
      
      // Store in memory for now - in production this would go to a real database
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(allData))
      }
    } catch (error) {
      console.error('Error saving data:', error)
      throw error
    }
  }

  static async load(collection: string): Promise<any[]> {
    try {
      const allData = this.getAllData()
      return allData[collection] || []
    } catch (error) {
      console.error('Error loading data:', error)
      return []
    }
  }

  static async create(collection: string, item: any): Promise<any> {
    try {
      const items = await this.load(collection)
      const newItem = { ...item, id: item.id || this.generateId() }
      items.unshift(newItem)
      await this.save(collection, items)
      return newItem
    } catch (error) {
      console.error('Error creating item:', error)
      throw error
    }
  }

  static async update(collection: string, id: string, updates: any): Promise<any> {
    try {
      const items = await this.load(collection)
      const index = items.findIndex(item => item.id === id)
      if (index === -1) {
        throw new Error(`Item with id ${id} not found`)
      }
      
      items[index] = { ...items[index], ...updates }
      await this.save(collection, items)
      return items[index]
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

  static async delete(collection: string, id: string): Promise<void> {
    try {
      const items = await this.load(collection)
      const filteredItems = items.filter(item => item.id !== id)
      await this.save(collection, filteredItems)
    } catch (error) {
      console.error('Error deleting item:', error)
      throw error
    }
  }

  private static getAllData(): any {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    }
    return {}
  }

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

// Export the storage service
export const storage = SimpleStorage
