import { ServiceContainer } from './src/container/ServiceContainer.js';
import { SourceController } from './src/controllers/SourceController.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { config } from './src/config/index.js';

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.TURSO_DATABASE_URL = 'file:./test.sqlite';

// Mock request and response objects
const mockReq = {
    method: 'POST',
    url: '/api/sources',
    headers: {
        'content-type': 'application/json'
    },
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    body: {
        name: "bbc-test",
        icon: "📰",
        url: "https://www.bbc.co.uk",
        favicon_url: "/api/favicon?url=https%3A%2F%2Fwww.bbc.co.uk",
        allocation: 300
    }
};

const mockRes = {
    _status: 200,
    _headers: new Map(),
    _data: null,
    status: function(code) {
        console.log('📊 Setting Response Status:', code);
        this._status = code;
        return this;
    },
    json: function(data) {
        console.log('📦 Setting Response Data:', data);
        this._data = data;
        return this;
    },
    setHeader: function(name, value) {
        console.log('🏷️ Setting Header:', name, value);
        this._headers.set(name, value);
        return this;
    },
    getStatus: function() {
        return this._status;
    },
    getData: function() {
        return this._data;
    },
    getHeaders: function() {
        return Object.fromEntries(this._headers);
    }
};

async function testAddSource() {
    console.log('🧪 Starting source addition test');
    
    try {
        // Initialize container
        console.log('📦 Initializing container...');
        const container = new ServiceContainer();
        await container.initialize();
        console.log('✅ Container initialized');

        // Create controller
        console.log('🎮 Creating controller...');
        const sourceController = new SourceController(container);
        console.log('✅ Controller created');

        // Test source addition
        console.log('🚀 Testing source addition...');
        console.log('Request body:', mockReq.body);
        
        // Add error handling middleware
        const next = (error) => {
            if (error) {
                console.log('🚨 Error caught by middleware:');
                errorHandler(error, mockReq, mockRes, () => {});
            }
        };

        await sourceController.handleSources(mockReq, mockRes).catch(next);
        
        // Print final response state
        console.log('\n📝 Final Response State:');
        console.log('Status:', mockRes.getStatus());
        console.log('Headers:', mockRes.getHeaders());
        console.log('Data:', mockRes.getData());
        
        if (mockRes.getStatus() === 201) {
            console.log('✅ Test completed successfully');
        } else {
            console.log('⚠️ Test completed with unexpected status:', mockRes.getStatus());
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    } finally {
        process.exit(0);
    }
}

testAddSource();