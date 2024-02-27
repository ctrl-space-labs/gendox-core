package dev.ctrlspace.gendox.gendoxcoreapi.utils.constants;

public class S3BucketIntegrationConstants {

    public static final String OBJECT_ROOT_EVENT = "/Records/0/eventName";
    public static final String OBJECT_ROOT_BUCKET_NAME = "/Records/0/s3/bucket/name";
    public static final String OBJECT_ROOT_KEY = "/Records/0/s3/object/key";
    public static final String EVENT_PUT_DOCUMENT = "ObjectCreated:Put";
    public static final String EVENT_DELETE_DOCUMENT = "ObjectRemoved:Delete";
}
