export const mockRoutes = [
  {
    id: 'river-greenway',
    name: 'River Greenway Connector',
    description:
      'Follows the Yahara river trail with protected lanes and upgraded lighting.',
    distanceMiles: 2.8,
    estimatedDuration: 24,
    safetyScore: 92,
    confidence: 'High',
    mode: 'bike',
    metrics: {
      safety: 95,
      balance: 88,
      speed: 72,
    },
    incidents: [
      {
        id: 'rg-incident-1',
        type: 'Lighting',
        description: 'LED fixtures added at bridges last month.',
      },
      {
        id: 'rg-incident-2',
        type: 'Community',
        description: 'Neighbors report low traffic after 7pm.',
      },
    ],
    coordinates: [
      { lat: 43.0849, lng: -89.3651 },
      { lat: 43.0815, lng: -89.3694 },
      { lat: 43.0767, lng: -89.3782 },
      { lat: 43.0726, lng: -89.3831 },
      { lat: 43.0689, lng: -89.3864 },
    ],
  },
  {
    id: 'campus-protected',
    name: 'Campus Protected Loop',
    description:
      'Protected lanes through UW campus with security patrol overlap.',
    distanceMiles: 3.1,
    estimatedDuration: 28,
    safetyScore: 88,
    confidence: 'Medium',
    mode: 'bike',
    metrics: {
      safety: 88,
      balance: 90,
      speed: 68,
    },
    incidents: [
      {
        id: 'cp-incident-1',
        type: 'Patrol',
        description: 'Campus safety bike patrol runs every 30 minutes.',
      },
      {
        id: 'cp-incident-2',
        type: 'Construction',
        description: 'Temporary cones along Observatory Dr. until 10/31.',
      },
    ],
    coordinates: [
      { lat: 43.0757, lng: -89.4043 },
      { lat: 43.0764, lng: -89.3972 },
      { lat: 43.0732, lng: -89.3944 },
      { lat: 43.0715, lng: -89.3981 },
      { lat: 43.0722, lng: -89.4055 },
      { lat: 43.0741, lng: -89.4082 },
    ],
  },
  {
    id: 'neighborhood-green',
    name: 'Neighborhood Green Street',
    description:
      'Traffic-calmed residential streets prioritized for walking at night.',
    distanceMiles: 2.2,
    estimatedDuration: 26,
    safetyScore: 86,
    confidence: 'High',
    mode: 'walk',
    metrics: {
      safety: 90,
      balance: 84,
      speed: 60,
    },
    incidents: [
      {
        id: 'ng-incident-1',
        type: 'Calming',
        description: 'Speed humps installed in August.',
      },
      {
        id: 'ng-incident-2',
        type: 'Crowdsourced',
        description: 'Neighbor submitted photo of new crosswalk beacons.',
      },
    ],
    coordinates: [
      { lat: 43.0728, lng: -89.4191 },
      { lat: 43.0701, lng: -89.4158 },
      { lat: 43.0684, lng: -89.4101 },
      { lat: 43.0677, lng: -89.4044 },
      { lat: 43.0685, lng: -89.3988 },
    ],
  },
]

export const feedbackCategories = [
  { value: 'lighting', label: 'Lighting' },
  { value: 'traffic', label: 'Traffic & speeding' },
  { value: 'infrastructure', label: 'Bike/walk infrastructure' },
  { value: 'community', label: 'Community reports' },
  { value: 'other', label: 'Something else' },
]
