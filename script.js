'use strict';

class workout {
    date = new Date();
    id = (Date.now() + '').slice(-8);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${this.date.getDate()} ${months[this.date.getMonth()]}`
    }
}

class Cycling extends workout {
    type = 'cycling'
    constructor(coords, distance, duration, elevGain) {
        super(coords, distance, duration);
        this.elevGain = elevGain;
        this.speedCycle()
        this._setDescription();
    }

    speedCycle() {
        this.speed = this.distance / (this.duration / 60);
    }
}

class Running extends workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.paceRun();
        this._setDescription();
    }

    paceRun() {
        this.pace = this.duration / this.distance;
    }
}

// let cycle1 = new Cycling((27 , 88), 20, 100, 658)
// let run1 = new Running((27 , 88), 8, 90, 231)
// console.log(cycle1, run1)


/////////////////////////////////////////////////////////////////////

let form = document.querySelector('.side-bar-form');
let sideList = document.querySelector('.side-bar-list');
let options = document.querySelector('.options');
let workoutInfo = document.querySelector('.workout-info');
let durationInput = document.querySelector('.duration-div input');
let distanceInput = document.querySelector('.distance-div input');
let cadenceInput = document.querySelector('.cadence-run input');
let elevGainInput = document.querySelector('.elev-gain-cycle input');
let cadenceRun = document.querySelector('.cadence-run');
let elevGainCycle = document.querySelector('.elev-gain-cycle');
let formInput = document.querySelector('#form-select');
let containerWorkout = document.querySelector('.workout');

class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        formInput.addEventListener('change', this._toggleElevationField);
        sideList.addEventListener('click', this._moveToMarker.bind(this));
        this._getLocalStorage();
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Could not get this position')
            })
    }

    _loadMap(position) {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        let coords = [latitude, longitude]
        console.log(latitude, longitude)
        console.log(position)

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // L.marker(co/ords).addTo(this.#map)
        //     .bindPopup('A pretty CSS popup.<br> Easily customizable.')
        //     .openPopup();

        this.#map.on('click', this._showForm.bind(this));
        
        this.#workouts.forEach(work => {
            this._renderMarker(work, work.type);
        })
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('form-hidden');
        // workoutInfo.style.marginTop = '25px';
        distanceInput.focus();
    }

    _toggleElevationField() {
        elevGainCycle.classList.toggle('hidden');
        cadenceRun.classList.toggle('hidden');

    }

    _newWorkout(e) {
        e.preventDefault();
        const { lat, lng } = this.#mapEvent.latlng;
        console.log(lat, lng);

        let validInputs = (...inputs) => (inputs.every(inp => Number.isFinite(inp)))
        let positiveInputs = (...inputs) => (inputs.every(inp => inp > 0))

        // collect data from form
        let duration = +durationInput.value;
        let distance = +distanceInput.value;
        let type = formInput.value;
        let workout;

        // check if data is valid

        // if workout running, create a running object
        if (type === 'running') {
            let cadence = +cadenceInput.value;
            console.log(type)

            console.log(Number.isFinite(duration))
            if (!validInputs(duration, distance, cadence) || !positiveInputs(duration, distance, cadence)) {
                console.log(duration)
                return alert('Enter a Valid Number')
            }
            workout = new Running([lat, lng], distance, duration, cadence)

        }

        // if workout cycling, create a cycling object
        if (type === 'cycling') {
            let elevGain = +elevGainInput.value;

            if (!validInputs(duration, distance, elevGain) || !positiveInputs(duration, distance)) {
                return alert('Enter a Valid Number')
            }

            workout = new Cycling([lat, lng], distance, duration, elevGain)
        }

        //add new object to workout array
        this.#workouts.push(workout);
        console.log(workout);
        console.log(this.#workouts);


        // render workout on map as marker
        this._renderMarker(workout, type);


        // render marker on list
        this._renderList(workout, type);


        // hide the form
        form.style.display = 'none';
        form.classList.add('form-hidden');
        setTimeout(() =>form.style.display = 'grid', 1000)
        durationInput.value = distanceInput.value = elevGainInput.value = cadenceInput.value = '';

        // setting local storage
        this._setLocalStorage();
    }

    _renderList(workout, type) {
       let html =
         `<li class="workout-info ${type}-popup">
         <div class="workout" data-id = ${workout.id} >     
         <h3 class="workout-date">${workout.description}</h3>
             <div class="workout-details">
                <span class="workout-icon">${type === 'running' ? '🏃‍♂️':'🚴‍♀️'}</span>
                <span class="workout-value">${workout.distance}</span>
                <span class="workout-unit">KM</span>
              </div>
                 <div class="workout-details">
                     <span class="workout-icon">⏱️</span>
                     <span class="workout-value">${workout.duration}</span>
                     <span class="workout-unit">MIN</span>
                 </div>
                 <div class="workout-details">
                     <span class="workout-icon">⚡</span>
                     <span class="workout-value">${type === 'running' ? workout.pace.toFixed(1) : workout.speed.toFixed(1)}</span>
                     <span class="workout-unit">${type === 'running' ? 'MIN/KM' : 'KM/H'}</span>
                 </div>
                 <div class="workout-details">
                     <span class="workout-icon">🤍</span>
                     <span class="workout-value">${type === 'running' ? workout.cadence : workout.elevGain}</span>
                     <span class="workout-unit">${type === 'running' ? 'SPM' : 'M'}</span>
                 </div>
          </div>
      </li>`

        form.insertAdjacentHTML('afterend', html)
    }

    _renderMarker(workout, type) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 200,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${type}-popup`
            }))
            .setPopupContent(workout.description)
            .openPopup();
    }

    _moveToMarker(e){
        let workoutEl =  e.target.closest('.workout');
        console.log(workoutEl);
        console.log(e.target);
        // console.log(e.curr)

        console.log('hey')
        if(!workoutEl) return;
        console.log(workoutEl.dataset.id)
        let workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id,
             )


            console.log(workout)
        this.#map.setView(workout.coords, 13 , {
            animate: true,
            pan: {
                duration: 1,
            }
        })
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage(){
        let data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if(!data) return;

        this.#workouts = data;
        console.log(this.#workouts)

        this.#workouts.forEach(work => {
            this._renderList(work, work.type);
        })
    }

     reset(){
        localStorage.removeItem('workouts');
        location.reload()
    }
}

let app = new App();
console.log(app)











