export async function uploadImageToDrive(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/google-drive', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image to Google Drive')
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error uploading to Google Drive:', error)
    throw new Error('Failed to upload image to Google Drive')
  }
}

export async function uploadTestToDrive(testData: any) {
  try {
    const body = new URLSearchParams();
    body.append('action', 'uploadTest');
    body.append('data', JSON.stringify(testData));

    const response = await fetch('/api/google-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.error('Upload error:', await response.text());
      throw new Error('Failed to upload test to Google Drive');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading test to Google Drive:', error);
    throw error;
  }
}

export async function getTestFromDrive(testId: string) {
  try {
    const response = await fetch('/api/google-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getTest',
        data: { testId },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get test from Google Drive')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting test from Google Drive:', error)
    throw error
  }
}

export async function getImageFromDrive(fileId: string): Promise<string> {
  try {
    const response = await fetch('/api/google-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getImage',
        data: { fileId },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get image from Google Drive')
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error getting image from Google Drive:', error)
    throw new Error('Failed to get image from Google Drive')
  }
}

export async function deleteImageFromDrive(fileId: string): Promise<void> {
  try {
    const response = await fetch('/api/google-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteImage',
        data: { fileId },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete image from Google Drive')
    }
  } catch (error) {
    console.error('Error deleting image from Google Drive:', error)
    throw new Error('Failed to delete image from Google Drive')
  }
} 