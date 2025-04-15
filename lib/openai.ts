// Solo exportamos la función para resetear el thread
export async function resetThread() {
  try {
    const response = await fetch('/api/chat/reset', {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('Error resetting thread:', error)
    return false
  }
} 