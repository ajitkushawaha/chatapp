import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

// PUT /api/keywords/[id] - Update keyword
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { keyword, response, isActive } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Keyword ID is required'
      }, { status: 400 });
    }

    // Get existing keyword
    const existingKeywords = await FirebaseService.getKeywords();
    const existingKeyword = existingKeywords.find(k => k.id === id);

    if (!existingKeyword) {
      return NextResponse.json({
        success: false,
        message: 'Keyword not found'
      }, { status: 404 });
    }

    // Update keyword data
    const updatedKeyword = {
      ...existingKeyword,
      keyword: keyword ? keyword.toLowerCase().trim() : existingKeyword.keyword,
      response: response ? response.trim() : existingKeyword.response,
      isActive: isActive !== undefined ? Boolean(isActive) : existingKeyword.isActive,
      updatedAt: new Date().toISOString()
    };

    const result = await FirebaseService.updateKeyword(id, updatedKeyword);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Keyword updated successfully',
        keyword: updatedKeyword
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to update keyword'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating keyword:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update keyword'
    }, { status: 500 });
  }
}

// DELETE /api/keywords/[id] - Delete keyword
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Keyword ID is required'
      }, { status: 400 });
    }

    const result = await FirebaseService.deleteKeyword(id);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Keyword deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete keyword'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete keyword'
    }, { status: 500 });
  }
}
