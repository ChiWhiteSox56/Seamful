import React from 'react';
import  {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api'
import { formatRelative } from 'date-fns';

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';

import {
  Combobox,
  ComboboxInput, 
  ComboboxPopover,
  ComboboxList,
  CombpboxOption,
  ComboboxOption,
} from '@reach/combobox';
import '@reach/combobox/styles.css';
import mapStyles from './mapStyles';

import { render } from '@testing-library/react';

// URL for this tutorial: https://www.youtube.com/watch?v=WZcxJGmLbSo

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
 
  const panTo = React.useCallback(({lat, lng}) => {
      mapRef.current.panTo({lat, lng});
      mapRef.current.setZoom(14);
    }, []); // empty array -> "no defs" -> never have to change the value of this function; common for all useCallbacks 

  if (loadError) return "Error loading maps"
  if (!isLoaded) return "Loading maps"

// USE 'STATE' WHEN YOU WANT REACT TO RE-RENDER; USE 'REF' WHEN YOU WANT TO RETAIN STATE WITHOUT CAUSING RE-RENDERS
// Do not overuse refs - pass props from parent to child whenever possible

  return (
    <div>
      <h1>Local Businesses <span role='img' aria-label='food'>🍲</span></h1>
      {/* // panTo passed as a prop to our Search component */}
      <Search panTo={panTo}/> 
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

function Search({panTo}) { // can receive panTo prop since it was passed to Search component
  const {
    ready, 
    value, 
    suggestions: {status, data}, 
    setValue, 
    clearSuggestions,
  } = usePlacesAutocomplete({ // this is a hook
    requestOptions: {
      location: {
        lat: () => 40.738810, // arrow function that returns lat vaue
        lng: () => -73.878380}, // arrow function tyat returns lng value
        radius: 10 * 1000 // wants measurement in meters, so 10kilometers * 1000 since 1000 meters = 1km
    },
  });

  // will be returning a combobox
  return (
    <div className='search'>
    <Combobox 
     // make async function because we're going to be using promises
      onSelect={async(address) => { // onSelect is a prop; will eventually receive the address that the user has selected
        setValue(address, false) // use false for shouldFetchData param because we know what user selected; we don't neet to retrieve that again from the Google API
        clearSuggestions()
        try {
          // have to await because this is a promise
          const results = await getGeocode({address});
          const {lat, lng} = await getLatLng(results[0]);
          panTo({lat, lng})
        } catch(error) {
          console.log("Error!")
        }

        console.log(address);
    }}
    >
      {/* // display 'value' from usePlacesAutomcomplete hook above */}
      {/* // onChange -> listen for when user makes changes; arrow function receives the event 'e' */}
      <ComboboxInput value={value} onChange={(e) => {
        setValue(e.target.value);
      }}
      disabled={!ready}
      placeholder='Enter an address'
      /> 
      {/* // ComboboxPopover recieves all of the suggestions that Google Places givs us */}
      <ComboboxPopover>
        {/* // DECONSTRUCT an id and a suggestion that's available on each suggestion */}
      {status === 'OK' && data.map(({id, description}) => (
        <ComboboxOption key={id} value={description}/>
      ))}
      </ComboboxPopover>
    </Combobox>
    </div>
  );
}