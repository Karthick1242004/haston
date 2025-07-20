# Cloudinary Image Cleanup Documentation

## Overview

This project now includes automatic Cloudinary image cleanup to prevent orphaned images from accumulating in your cloud storage. When you remove or replace images in the admin dashboard, the old images are automatically deleted from Cloudinary to save storage space and costs.

## How It Works

### Automatic Cleanup

The system automatically handles image cleanup in these scenarios:

1. **Product Deletion**: When you delete a product entirely, all associated images are removed from Cloudinary
2. **Image Replacement**: When you edit a product and remove specific images, those images are deleted from Cloudinary
3. **Image Updates**: When you replace images during product editing, old images are cleaned up

### Technical Implementation

- **Database First**: The product is updated in the database first to ensure data consistency
- **Async Cleanup**: Images are deleted from Cloudinary asynchronously to avoid blocking the admin interface
- **Error Handling**: Failed deletions are logged but don't affect the product update process
- **Public ID Extraction**: URLs are parsed to extract Cloudinary public IDs for deletion

## Admin Dashboard Features

### Visual Feedback

When editing products, you'll see:
- Clear labeling that removed images will be deleted from storage
- Improved remove buttons (×) with hover effects
- Helper text explaining the cleanup process

### Validation

- Create mode: Requires at least one image
- Edit mode: Allows updates if existing images remain
- Proper error messages for missing images

## Manual Cleanup Script

For cleaning up orphaned images that may exist from before this feature was implemented:

### Usage

```bash
# Dry run - see what would be deleted (recommended first)
node scripts/cleanup-orphaned-images.js

# Actually delete orphaned images
node scripts/cleanup-orphaned-images.js --delete
```

### What the Script Does

1. **Scans Database**: Finds all image URLs referenced by products
2. **Scans Cloudinary**: Gets all images in the 'products' folder
3. **Compares**: Identifies images in Cloudinary not referenced in the database
4. **Reports**: Shows you exactly what would be deleted and storage savings
5. **Cleanup**: Optionally deletes orphaned images (with --delete flag)

### Example Output

```
🧹 Cloudinary Orphaned Images Cleanup Tool
==========================================
🔍 Running in DRY RUN mode - no images will be deleted

Found 45 unique images referenced in 12 products
Fetching all images from Cloudinary products folder...
Found 52 images in Cloudinary

📋 Found 7 orphaned images:
  - products/old_image_123 (2.34MB, created: 2024-01-15)
  - products/unused_image_456 (1.87MB, created: 2024-01-10)
  ...

DRY RUN SUMMARY:
Would delete 7 orphaned images
Would free up 15.67MB of storage

To actually delete these images, run: node scripts/cleanup-orphaned-images.js --delete
```

## Environment Variables Required

Ensure these environment variables are set for Cloudinary operations:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MONGODB_URI=your_mongodb_uri
```

## Benefits

### Cost Savings
- Reduces Cloudinary storage usage
- Lower monthly bills for image storage
- Prevents accumulation of unused files

### Performance
- Faster Cloudinary dashboard loading
- Cleaner file organization
- Easier asset management

### Maintenance
- Automatic cleanup requires no manual intervention
- Periodic script can clean up historical orphaned files
- Better resource utilization

## Best Practices

1. **Test First**: Always run the cleanup script in dry-run mode first
2. **Backup**: Consider backing up important images before bulk deletion
3. **Monitor**: Check Cloudinary usage regularly to ensure cleanup is working
4. **Schedule**: Consider running the cleanup script monthly via cron job

## Troubleshooting

### Common Issues

**Script shows "No images found"**
- Check environment variables are set correctly
- Verify MongoDB connection
- Ensure Cloudinary credentials are valid

**Some images not being deleted**
- Check console logs for specific error messages
- Verify images are in the 'products' folder
- Ensure images aren't referenced in other collections

**Build errors**
- Ensure all dependencies are installed
- Check that TypeScript types are properly imported
- Verify environment variables are accessible

### Logs

The system provides detailed logging:
- Product deletion: "Cleaning up X images for deleted product Y"
- Image updates: "Cleaning up X removed images for product Y"
- Cleanup script: Detailed progress and summary reports

## Future Enhancements

Potential improvements to consider:
- Batch deletion API for better performance
- Image usage analytics
- Automatic backup before deletion
- Integration with other image storage providers
- Real-time storage usage monitoring

## Support

If you encounter issues with the cleanup functionality:
1. Check the console logs for detailed error messages
2. Verify your Cloudinary credentials and permissions
3. Test with the dry-run script first
4. Check that your Cloudinary account has sufficient API limits

Remember: The cleanup is designed to be safe and non-blocking, so your admin interface will work even if cleanup encounters errors. 