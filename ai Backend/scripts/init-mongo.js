// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the ai_conversations database
db = db.getSiblingDB('ai_conversations');

// Create collections with validation
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'username', 'hashed_password'],
            properties: {
                email: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                },
                username: {
                    bsonType: 'string',
                    minLength: 3,
                    maxLength: 30
                },
                hashed_password: {
                    bsonType: 'string'
                },
                is_active: {
                    bsonType: 'bool'
                },
                is_verified: {
                    bsonType: 'bool'
                }
            }
        }
    }
});

db.createCollection('conversations', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'status'],
            properties: {
                user_id: {
                    bsonType: 'objectId'
                },
                title: {
                    bsonType: 'string',
                    maxLength: 200
                },
                status: {
                    bsonType: 'string',
                    enum: ['active', 'paused', 'completed', 'archived']
                },
                message_count: {
                    bsonType: 'int',
                    minimum: 0
                }
            }
        }
    }
});

db.createCollection('messages', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['conversation_id', 'content', 'message_type'],
            properties: {
                conversation_id: {
                    bsonType: 'objectId'
                },
                content: {
                    bsonType: 'string',
                    maxLength: 5000
                },
                message_type: {
                    bsonType: 'string',
                    enum: ['user', 'assistant', 'system']
                },
                status: {
                    bsonType: 'string',
                    enum: ['pending', 'processing', 'completed', 'failed']
                }
            }
        }
    }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ created_at: 1 });

db.conversations.createIndex({ user_id: 1 });
db.conversations.createIndex({ created_at: 1 });
db.conversations.createIndex({ updated_at: 1 });
db.conversations.createIndex({ status: 1 });

db.messages.createIndex({ conversation_id: 1 });
db.messages.createIndex({ timestamp: 1 });
db.messages.createIndex({ message_type: 1 });

// Create compound indexes
db.conversations.createIndex({ user_id: 1, status: 1 });
db.conversations.createIndex({ user_id: 1, updated_at: -1 });
db.messages.createIndex({ conversation_id: 1, timestamp: -1 });

print('Database initialization completed successfully!');
