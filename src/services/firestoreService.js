import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Firestore Service for managing user data and chat history
export const firestoreService = {
  
  // User Management
  users: {
    // Create or update user profile
    createOrUpdate: async (userId, userData) => {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true };
      } catch (error) {
        console.error('Error creating/updating user:', error);
        return { success: false, error: error.message };
      }
    },

    // Get user profile
    get: async (userId) => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          return { success: true, data: userSnap.data() };
        } else {
          return { success: false, error: 'User not found' };
        }
      } catch (error) {
        console.error('Error getting user:', error);
        return { success: false, error: error.message };
      }
    },

    // Update user profile
    update: async (userId, updates) => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        return { success: true };
      } catch (error) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // Chat Conversations Management
  conversations: {
    // Create a new conversation
    create: async (userId, title = 'New Conversation') => {
      try {
        const conversationRef = await addDoc(collection(db, 'conversations'), {
          userId,
          title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messageCount: 0
        });
        
        return { 
          success: true, 
          conversationId: conversationRef.id 
        };
      } catch (error) {
        console.error('Error creating conversation:', error);
        return { success: false, error: error.message };
      }
    },

    // Get all conversations for a user
    getByUser: async (userId) => {
      try {
        const q = query(
          collection(db, 'conversations'),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const conversations = [];
        
        querySnapshot.forEach((doc) => {
          conversations.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return { success: true, data: conversations };
      } catch (error) {
        console.error('Error getting conversations:', error);
        return { success: false, error: error.message };
      }
    },

    // Get a specific conversation
    get: async (conversationId) => {
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
          return { 
            success: true, 
            data: { id: conversationSnap.id, ...conversationSnap.data() }
          };
        } else {
          return { success: false, error: 'Conversation not found' };
        }
      } catch (error) {
        console.error('Error getting conversation:', error);
        return { success: false, error: error.message };
      }
    },

    // Update conversation
    update: async (conversationId, updates) => {
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        return { success: true };
      } catch (error) {
        console.error('Error updating conversation:', error);
        return { success: false, error: error.message };
      }
    },

    // Delete conversation
    delete: async (conversationId) => {
      try {
        // Delete all messages in the conversation first
        const messagesResult = await firestoreService.messages.getByConversation(conversationId);
        if (messagesResult.success) {
          for (const message of messagesResult.data) {
            await deleteDoc(doc(db, 'messages', message.id));
          }
        }
        
        // Delete the conversation
        await deleteDoc(doc(db, 'conversations', conversationId));
        return { success: true };
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // Chat Messages Management
  messages: {
    // Add a new message to a conversation
    add: async (conversationId, messageData) => {
      try {
        const messageRef = await addDoc(collection(db, 'messages'), {
          conversationId,
          ...messageData,
          createdAt: serverTimestamp()
        });

        // Update conversation's message count and last updated time
        await firestoreService.conversations.update(conversationId, {
          messageCount: (await firestoreService.messages.getByConversation(conversationId)).data.length + 1
        });
        
        return { 
          success: true, 
          messageId: messageRef.id 
        };
      } catch (error) {
        console.error('Error adding message:', error);
        return { success: false, error: error.message };
      }
    },

    // Get all messages for a conversation
    getByConversation: async (conversationId, limitCount = 50) => {
      try {
        const q = query(
          collection(db, 'messages'),
          where('conversationId', '==', conversationId),
          orderBy('createdAt', 'asc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const messages = [];
        
        querySnapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return { success: true, data: messages };
      } catch (error) {
        console.error('Error getting messages:', error);
        return { success: false, error: error.message };
      }
    },

    // Delete a message
    delete: async (messageId) => {
      try {
        await deleteDoc(doc(db, 'messages', messageId));
        return { success: true };
      } catch (error) {
        console.error('Error deleting message:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // Utility functions
  utils: {
    // Get server timestamp
    getServerTimestamp: () => serverTimestamp(),
    
    // Batch operations helper
    batch: {
      // Add multiple messages at once
      addMessages: async (messages) => {
        try {
          const promises = messages.map(message => 
            firestoreService.messages.add(message.conversationId, message)
          );
          
          await Promise.all(promises);
          return { success: true };
        } catch (error) {
          console.error('Error in batch add messages:', error);
          return { success: false, error: error.message };
        }
      }
    }
  }
};

export default firestoreService;
