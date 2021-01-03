import React from 'react';
import  {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api'
import { formatRelative } from 'date-fns';

// import usePlacesAutocomplete, {
//   getGeocode,
//   getLatLng,
// } from 'use-places-automcomplete';
import {
  Combobox,
  ComboboxInput, 
  ComboboxPopover,
  ComboboxList,
  CombpboxOption,
} from '@reach/combobox';

import mapStyles from './mapStyles';

import '@reach/combobox/styles.css';
import { render } from '@testing-library/react';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};
const center = {
  lat: 40.738810,
  lng: -73.878380,
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};

export default function App() {
  const {isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Hooks
  const [markers, setMarkers] = React.useState([]); // start off with markers as an empty array
  const [selected, setSelected] = React.useState(null);
  
  // useCallback is used when you want to define a function that won't change unless the props passed in the array change
  const onMapClick = React.useCallback((event) => {
    // state setter function; receive current state, return new version of it (including all previous states)
    setMarkers((current) =>  [
      ...current, 
      {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      time: new Date()
    },
  ]) ;
  }, []); // if this array changes, this function will be called

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map; // can access current map anywhere in the code without re-rendering
  }, []);
 
  if (loadError) return "Error loading maps"
  if (!isLoaded) return "Loading maps"

// USE 'STATE' WHEN YOU WANT REACT TO RE-RENDER; USE 'REF' WHEN YOU WANT TO RETAIN STATE WITHOUT CAUSING RE-RENDERS
// Do not overuse refs - pass props from parent to child whenever possible

  return (
    <div>
      <h1>Local Businesses <span role='img' aria-label='food'>🍲</span></h1>
      {/* props: mapContainerStyle, zoom, center, options, onClick, onMapLoad */}
      <GoogleMap 
        mapContainerStyle={mapContainerStyle} 
        zoom={8} 
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {/* props: key, position, icon */}
        {markers.map(marker => <Marker 
          key={marker.time.toISOString()}
          position={{lat: marker.lat, lng: marker.lng}}
          icon={{
            url: '/restaurant.svg',
            scaledSize: new window.google.maps.Size(30,30),
            origin: new window.google.maps.Point(0,0),
            anchor: new window.google.maps.Point(15, 15),
          }}
          onClick={() => {
            setSelected(marker);
          }}
          />
          )}

          {selected ? (
            <InfoWindow position={{lat: selected.lat, lng: selected.lng}} 
            onCloseClick={() => {
              setSelected(null);
            }}
            >
             <div>
               <h2>Restaurant Identified!</h2>
                <p>Identified {formatRelative(selected.time, new Date())}</p>
             </div>
            </InfoWindow>
          ) : null}
      </GoogleMap>
    </div>
  );
}