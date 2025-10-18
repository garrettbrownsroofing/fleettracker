// Firestore REST API client (no authentication required for public access)
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'fleet-tracker-475514'

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

export async function createDocument(collection: string, documentId: string, data: any) {
  try {
    const url = `${FIRESTORE_URL}/${collection}/${documentId}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(data)
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating document:', error)
    throw error
  }
}

export async function getDocuments(collection: string) {
  try {
    const url = `${FIRESTORE_URL}/${collection}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.documents?.map(doc => convertFromFirestoreFields(doc)) || []
  } catch (error) {
    console.error('Error getting documents:', error)
    return []
  }
}

export async function updateDocument(collection: string, documentId: string, data: any) {
  try {
    const url = `${FIRESTORE_URL}/${collection}/${documentId}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(data)
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating document:', error)
    throw error
  }
}

export async function deleteDocument(collection: string, documentId: string) {
  try {
    const url = `${FIRESTORE_URL}/${collection}/${documentId}`
    const response = await fetch(url, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`)
    }
    
    return true
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

// Helper functions to convert between JavaScript objects and Firestore field format
function convertToFirestoreFields(obj: any) {
  const fields: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      fields[key] = { nullValue: null }
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value }
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value }
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() }
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(item => convertToFirestoreFields(item)) } }
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } }
    }
  }
  
  return fields
}

function convertFromFirestoreFields(doc: any) {
  const data: any = { id: doc.name.split('/').pop() }
  
  if (doc.fields) {
    for (const [key, field] of Object.entries(doc.fields as any)) {
      data[key] = convertFromFirestoreField(field)
    }
  }
  
  return data
}

function convertFromFirestoreField(field: any) {
  if (field.nullValue !== undefined) return null
  if (field.stringValue !== undefined) return field.stringValue
  if (field.doubleValue !== undefined) return field.doubleValue
  if (field.booleanValue !== undefined) return field.booleanValue
  if (field.timestampValue !== undefined) return new Date(field.timestampValue)
  if (field.arrayValue) return field.arrayValue.values.map(convertFromFirestoreField)
  if (field.mapValue) {
    const result: any = {}
    for (const [key, value] of Object.entries(field.mapValue.fields || {})) {
      result[key] = convertFromFirestoreField(value)
    }
    return result
  }
  return field
}
