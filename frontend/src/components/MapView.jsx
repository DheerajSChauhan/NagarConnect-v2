import PropTypes from 'prop-types';
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { complaintMarkers, priorities } from "../data/mockData";

const iconByPriority = {
  urgent: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  medium: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  low: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

const clusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const color = count >= 25 ? "#C62828" : count >= 10 ? "#E65100" : "#2E7D32";
  return L.divIcon({
    html: `<div style="background:${color};color:#fff;border-radius:999px;min-width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.22)">${count}</div>`,
    className: "",
    iconSize: [40, 40],
  });
};

const ZoomableMarker = ({ item, onUpvote, isUpvoted }) => {
  const map = useMap();

  return (
    <Marker
      position={item.coordinates}
      icon={iconByPriority[item.priority]}
      eventHandlers={{
        click: () => {
          map.flyTo(item.coordinates, Math.max(map.getZoom(), 16), { duration: 0.6 });
        },
      }}
    >
      <Popup>
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900">{item.title}</h4>
          <p className="text-xs text-slate-600">{item.category} · {priorities[item.priority].label}</p>
          <p className="text-xs text-slate-600">Status: {item.status}</p>
          <p className="text-xs text-slate-600">Date: {item.date}</p>
          <button
            type="button"
            onClick={() => onUpvote?.(item.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
              isUpvoted(item.id) ? "bg-[#145a32]" : "bg-primary hover:bg-[#145a32]"
            }`}
          >
            Upvote ({item.upvotes})
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

const FocusMarker = ({ focusCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(focusCoordinates) || focusCoordinates.length !== 2) {
      return;
    }
    map.flyTo(focusCoordinates, Math.max(map.getZoom(), 16), { duration: 0.65 });
  }, [focusCoordinates, map]);

  return null;
};

const MapView = ({
  selectedCategory = "All",
  selectedPriority = "all",
  showHeatmap = false,
  heightClass = "h-[500px]",
  complaints = complaintMarkers,
  focusMarkerId,
  onUpvote,
  isUpvoted = () => false,
}) => {
  const filtered = useMemo(
    () =>
      complaints.filter((item) => {
        const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;
        const priorityMatch = selectedPriority === "all" || item.priority === selectedPriority;
        return categoryMatch && priorityMatch;
      }),
    [complaints, selectedCategory, selectedPriority]
  );

  const focusCoordinates = useMemo(() => {
    const found = filtered.find((item) => item.id === focusMarkerId);
    return found?.coordinates || null;
  }, [filtered, focusMarkerId]);

  return (
    <div className={`kolam-border relative z-0 overflow-hidden rounded-2xl border shadow-card ${heightClass}`}>
      <MapContainer center={[22.5937, 78.9629]} zoom={5} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FocusMarker focusCoordinates={focusCoordinates} />

        <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon}>
          {filtered.map((item) => (
            <ZoomableMarker key={item.id} item={item} onUpvote={onUpvote} isUpvoted={isUpvoted} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {showHeatmap ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(211,47,47,0.18),transparent_45%),radial-gradient(circle_at_75%_35%,rgba(245,124,0,0.16),transparent_48%),radial-gradient(circle_at_50%_75%,rgba(56,142,60,0.13),transparent_52%)]" />
      ) : null}
    </div>
  );
};

MapView.propTypes = {
  selectedCategory: PropTypes.string,
  selectedPriority: PropTypes.string,
  showHeatmap: PropTypes.bool,
  heightClass: PropTypes.string,
  complaints: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    category: PropTypes.string,
    priority: PropTypes.string,
  })),
  focusMarkerId: PropTypes.string,
  onUpvote: PropTypes.func,
  isUpvoted: PropTypes.func,
};

FocusMarker.propTypes = {
  focusCoordinates: PropTypes.arrayOf(PropTypes.number),
};

FocusMarker.defaultProps = {
  focusCoordinates: null,
};

ZoomableMarker.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    date: PropTypes.string,
    coordinates: PropTypes.arrayOf(PropTypes.number),
    priority: PropTypes.string,
    upvotes: PropTypes.number,
  }).isRequired,
  onUpvote: PropTypes.func,
  isUpvoted: PropTypes.func.isRequired,
};

ZoomableMarker.defaultProps = {
  onUpvote: undefined,
};

MapView.defaultProps = {
  selectedCategory: 'All',
  selectedPriority: 'all',
  showHeatmap: false,
  heightClass: 'h-[500px]',
  complaints: complaintMarkers,
  focusMarkerId: undefined,
  onUpvote: undefined,
  isUpvoted: () => false,
};

export default MapView;
