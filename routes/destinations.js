// routes/destinations.js
import express from 'express';

const router = express.Router();

// Mock destinations data
const mockDestinations = [
  {
    id: 1,
    name: "Sigiriya Rock Fortress",
    location: "Sigiriya",
    type: "Historical Site",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1580910527739-556eb89f9d65?q=80&w=1074&auto=format&fit=crop",
    price: "LKR 2,500",
    duration: "2-3 hours",
    description: "Ancient rock fortress and palace ruins with stunning views from the top of the rock."
  },
  {
    id: 2,
    name: "Temple of the Tooth",
    location: "Kandy",
    type: "Religious Site",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1642498041677-d26b9dfc5e61?q=80&w=688&auto=format&fit=crop",
    price: "LKR 1,500",
    duration: "1-2 hours",
    description: "Sacred Buddhist temple housing the tooth relic of Buddha, a UNESCO World Heritage site."
  },
  {
    id: 3,
    name: "Ella Nine Arch Bridge",
    location: "Ella",
    type: "Scenic Spot",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1586500036706-41963de24d8b?q=80&w=1172&auto=format&fit=crop",
    price: "Free",
    duration: "1 hour",
    description: "Iconic railway bridge in the hill country offering spectacular views."
  },
  {
    id: 4,
    name: "Yala National Park",
    location: "Yala",
    type: "Wildlife",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1549366021-9f761d040a94?q=80&w=1200&auto=format&fit=crop",
    price: "LKR 3,500",
    duration: "Half day",
    description: "Famous national park known for leopards and diverse wildlife."
  },
  {
    id: 5,
    name: "Adam's Peak",
    location: "Ratnapura",
    type: "Mountain",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
    price: "Free",
    duration: "Full day",
    description: "Sacred mountain with pilgrimage significance and sunrise views."
  },
  {
    id: 6,
    name: "Galle Fort",
    location: "Galle",
    type: "Historical Site",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1586500036706-41963de24d8b?q=80&w=1200&auto=format&fit=crop",
    price: "Free",
    duration: "2-3 hours",
    description: "Historic Dutch fort with colonial architecture and ocean views."
  }
];

// Get all destinations
router.get('/', (req, res) => {
  try {
    console.log('GET /destinations - Returning mock destinations data');
    res.json({
      success: true,
      data: mockDestinations
    });
  } catch (error) {
    console.error('Error in GET /destinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch destinations'
    });
  }
});

// Get destination by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const destination = mockDestinations.find(dest => dest.id === parseInt(id));
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }
    
    console.log(`GET /destinations/${id} - Returning destination:`, destination.name);
    res.json({
      success: true,
      data: destination
    });
  } catch (error) {
    console.error(`Error in GET /destinations/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch destination'
    });
  }
});

// Search destinations
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    let filteredDestinations = mockDestinations;
    
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredDestinations = mockDestinations.filter(dest => 
        dest.name.toLowerCase().includes(searchTerm) ||
        dest.location.toLowerCase().includes(searchTerm) ||
        dest.type.toLowerCase().includes(searchTerm) ||
        dest.description.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`GET /destinations/search?q=${q} - Found ${filteredDestinations.length} destinations`);
    res.json({
      success: true,
      data: filteredDestinations
    });
  } catch (error) {
    console.error('Error in GET /destinations/search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search destinations'
    });
  }
});

export default router;