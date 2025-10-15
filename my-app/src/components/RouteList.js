import RouteCard from './RouteCard';
import './RouteList.css';

const RouteList = ({ routes, activeRouteId, onSelect }) => (
  <div className="route-list">
    {routes.map((route) => (
      <RouteCard
        key={route.id}
        route={route}
        isActive={route.id === activeRouteId}
        onSelect={onSelect}
      />
    ))}
  </div>
);

export default RouteList;
