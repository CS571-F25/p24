export const mockRoutes = [
  {
    id: 'route-fastest',
    label: 'Fastest Route',
    type: 'fastest',
    distanceMi: 1.4,
    durationMin: 18,
    safetyScore: 3.2,
    confidence: 'medium',
    summary: 'Fastest option via Market St. Slightly lower lighting near 3rd Ave.',
    coordinates: [
      [37.77919, -122.41914],
      [37.7782, -122.41459],
      [37.77703, -122.41003],
      [37.77658, -122.40632],
      [37.77516, -122.40334]
    ],
    incidents: [
      'Recent noise complaints near Mission & 6th.',
      'Limited street lighting reported between 4th and 3rd.'
    ],
    recommendations: ['Stay on the north side of Market St.', 'Avoid alleys after 10pm']
  },
  {
    id: 'route-safest',
    label: 'Safest Route',
    type: 'safest',
    distanceMi: 1.7,
    durationMin: 22,
    safetyScore: 4.6,
    confidence: 'high',
    summary: 'Better lighting along Stockton St and increased patrol presence.',
    coordinates: [
      [37.77919, -122.41914],
      [37.78042, -122.41421],
      [37.78327, -122.40964],
      [37.78516, -122.40792],
      [37.78695, -122.40461]
    ],
    incidents: [
      'No major incidents reported within the last 30 days.',
      'High pedestrian visibility reported by SafeCommute community.'
    ],
    recommendations: [
      'Stay near storefronts between 10pm-2am.',
      'Use the public square as a safe meetup point.'
    ]
  },
  {
    id: 'route-balanced',
    label: 'Balanced Route',
    type: 'balanced',
    distanceMi: 1.5,
    durationMin: 20,
    safetyScore: 4.0,
    confidence: 'medium',
    summary: 'Balanced route using New Montgomery and Sansome corridors.',
    coordinates: [
      [37.77919, -122.41914],
      [37.78092, -122.41621],
      [37.78183, -122.41152],
      [37.78261, -122.40834],
      [37.78424, -122.40376]
    ],
    incidents: [
      'Isolated pickpocket incident reported two weeks ago.',
      'Lighting rated good but sidewalks narrow near Montgomery.'
    ],
    recommendations: [
      'Travel with a buddy if after midnight.',
      'Pause at Montgomery BART plaza for check-ins.'
    ]
  }
];

export const mockFeedbackCategories = [
  { value: 'well-lit', label: 'Well Lit Area' },
  { value: 'low-traffic', label: 'Low Traffic' },
  { value: 'patrolled', label: 'Active Patrol' },
  { value: 'watch-out', label: 'Avoid / Watch Out' },
  { value: 'other', label: 'Other' }
];
