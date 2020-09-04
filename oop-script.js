//the API documentation site https://developers.themoviedb.org/3/

class App {
    static async run() {
        const movies = await APIService.fetchMovies()
        HomePage.renderHomepageContent(movies);
        HomePage.renderNav()
    }
}



class APIService {
    static TMDB_BASE_URL = 'https://api.themoviedb.org/3';




    static async fetchMovies() {
        const url = APIService._constructUrl(`movie/now_playing`)
        const response = await fetch(url)

        const data = await response.json()
        return data.results.map(movie => new Movie(movie))
    }
    static async fetchMovie(path = "movie", movieId) {
        const url = APIService._constructUrl(`${path}/${movieId}`, `&append_to_response=`, "videos")
        const response = await fetch(url)
        const data = await response.json()
        return new Movie(data)
    }

    static async fetchCredits(path, movie) {
        const url = APIService._constructUrl(`${path}/${movie.id}/credits`)
        const response = await fetch(url)
        const data = await response.json()
        return data
    }



    static _constructUrl(path, append = "", item = "") {
        return `${this.TMDB_BASE_URL}/${path}?api_key=${'50263a781de21add754e80576984b3e5'}${append + item}`;
    }


    static async search() {
        const searchInput = document.getElementById("searchBox").value
        const searchStr = searchInput.trim().replace(" ", "+")
        const queryUrl = APIService._constructUrl("search/multi") + `&query=${searchStr}` + `&page=1&include_adult=false`
        const queryResponse = await fetch(queryUrl)
        const queryData = await queryResponse.json()
        console.log(queryData.results)
        return queryData.results.map(x => {
            if (x.media_type === "tv" || x.media_type === "movie") {
                return new Movie(x)
            }
            else {
                return new Person(x)
            }
        })

    }

    static async fetchFilter(type = "movie", sortBy = "popularity.desc", genreId = "", include_video = "true", page = "1", voteCountgte = "0", voteAveragegte, withRuntimegte = "0", voteAveragelte = "10") {
        const url = APIService._constructUrl(`discover/${type}`) + `&sort_by=${sortBy}` + `&with_genres=${genreId}` + `&include_video=${include_video}` + `&page=${page}` + `&vote_count.gte=${voteCountgte}` + `&with_runtime.gte=${withRuntimegte}` + (voteAveragegte ? `&vote_average.gte=${voteAveragegte}` : `&vote_average.lte=${voteAveragelte}`)
        const response = await fetch(url)
        const data = await response.json()
        return data.results
    }


    static async getSimilar(path, movie) {
        const url = APIService._constructUrl(`${path}/${movie.id}/similar`)
        const response = await fetch(url)
        const data = await response.json()
        return data.results.map(x => new Movie(x))
    }

    static async fetchReviews(path, movie) {
        const url = APIService._constructUrl(`${path}/${movie.id}`, "&append_to_response=", "reviews")
        const response = await fetch(url)
        const data = await response.json()
        return data
    }

    static async fetchActor(personId) {
        const url = APIService._constructUrl(`person/${personId}`, "&append_to_response=", "movies")
        const response = await fetch(url)
        const data = await response.json()
        return new Person(data)
    }

    static async fetchGenres(type) {
        const url = APIService._constructUrl(`genre/${type}/list`)
        const response = await fetch(url)
        const data = await response.json()
        return data.genres
    }

    static async fetchPopularActors() {
        const url = APIService._constructUrl(`person/popular`) + `&append_to_response=birthday`
        const response = await fetch(url)
        const data = await response.json()
        return data.results.map(x => new Person(x))
    }
}

class HomePage {

    static container = document.getElementById('container');




    static async renderNav() {
        const movieGenres = document.getElementById("movie-dropdown")
        const tvGenres = document.getElementById("tv-dropdown")
        const actorActresses = document.getElementById("actorActresses")
        const about = document.getElementById("about")
        const searchButton = document.getElementById("searchButton")
        //creates genre list for movies
        APIService.fetchGenres("movie").then(genreList => {
            for (const each of genreList) {
                movieGenres.innerHTML += `<a class="dropdown-item movie-genre" id=${each.id} href="#">${each.name}</a>`
            }
            const movieGenre = document.getElementsByClassName("movie-genre")
            for (const each of movieGenre) {
                each.addEventListener("click", async function () {
                    const result = await APIService.fetchFilter("movie", "popularity.desc", `${each.id}`)

                    HomePage.renderHomepageContent(result.map(x => new Movie(x)))

                })
            }
        })


        about.addEventListener("click", (e) => {
            this.container.innerHTML = `<h3>About</h3>
            
            <p> Lorem ipsum  Quisque id tellus euismod, interdum mi ac, mattis ligula. Ut scelerisque luctus ex, sit amet aliquet tortor faucibus sed. Suspendisse dignissim augue leo, quis varius tellus lobortis quis. Ut vehicula id tellus nec congue. Duis pharetra massa vitae congue luctus. Mauris a semper nunc, eu lobortis ante. Morbi tempor, lectus in varius porta, est erat imperdiet magna, id molestie felis erat non eros. Nullam tellus ligula, rhoncus in tempus in, finibus vitae felis. Donec aliquam fermentum aliquam. Phasellus elementum, purus nec eleifend interdum, libero neque varius tellus, in volutpat nunc sem ac elit. Aliquam ornare posuere iaculis. Quisque sit amet libero iaculis, dictum ligula at, placerat enim. Etiam egestas quam dictum, lacinia libero eu, euismod felis. Morbi feugiat vulputate odio id pretium. Nunc rutrum auctor velit.  </p>
            <p> Lorem ipsum  Quisque id tellus euismod, interdum mi ac, mattis ligula. Ut scelerisque luctus ex, sit amet aliquet tortor faucibus sed. Suspendisse dignissim augue leo, quis varius tellus lobortis quis. Ut vehicula id tellus nec congue. Duis pharetra massa vitae congue luctus. Mauris a semper nunc, eu lobortis ante. Morbi tempor, lectus in varius porta, est erat imperdiet magna, id molestie felis erat non eros. Nullam tellus ligula, rhoncus in tempus in, finibus vitae felis. Donec aliquam fermentum aliquam. Phasellus elementum, purus nec eleifend interdum, libero neque varius tellus, in volutpat nunc sem ac elit. Aliquam ornare posuere iaculis. Quisque sit amet libero iaculis, dictum ligula at, placerat enim. Etiam egestas quam dictum, lacinia libero eu, euismod felis. Morbi feugiat vulputate odio id pretium. Nunc rutrum auctor velit.  </p>
            <p> Lorem ipsum  Quisque id tellus euismod, interdum mi ac, mattis ligula. Ut scelerisque luctus ex, sit amet aliquet tortor faucibus sed. Suspendisse dignissim augue leo, quis varius tellus lobortis quis. Ut vehicula id tellus nec congue. Duis pharetra massa vitae congue luctus. Mauris a semper nunc, eu lobortis ante. Morbi tempor, lectus in varius porta, est erat imperdiet magna, id molestie felis erat non eros. Nullam tellus ligula, rhoncus in tempus in, finibus vitae felis. Donec aliquam fermentum aliquam. Phasellus elementum, purus nec eleifend interdum, libero neque varius tellus, in volutpat nunc sem ac elit. Aliquam ornare posuere iaculis. Quisque sit amet libero iaculis, dictum ligula at, placerat enim. Etiam egestas quam dictum, lacinia libero eu, euismod felis. Morbi feugiat vulputate odio id pretium. Nunc rutrum auctor velit.  </p>`
        })

        searchButton.addEventListener("click", async function (e) {
            e.preventDefault()
            const results = await APIService.search()

            HomePage.renderHomepageContent(results)
        })




        //creates genre list for TV
        APIService.fetchGenres("tv").then(genreList => {
            for (const each of genreList) {
                tvGenres.innerHTML += `<a class="dropdown-item tv-genre" id=${each.id} href="#">${each.name}</a>`
            }

            const tvGenre = document.getElementsByClassName("tv-genre")
            for (const each of tvGenre) {
                each.addEventListener("click", async function () {
                    const result = await APIService.fetchFilter("tv", "popularity.desc", `${each.id}`)

                    HomePage.renderHomepageContent(result.map(x => new Movie(x)))
                })
            }
        })
        //actor/actresses
        actorActresses.addEventListener("click", (e) => {
            e.preventDefault()
            APIService.fetchPopularActors().then(actors => {
                HomePage.renderHomepageContent(actors)
            })
        })


    }

    static renderHomepageContent(obj) {
        this.container.innerHTML = ""

        obj.forEach(el => {

            const elDiv = document.createElement("div");
            const elImage = document.createElement("img");
            const elImageBase = "http://image.tmdb.org/t/p/w780"
            const elTitle = document.createElement("h3");
            const elGenres = document.createElement("p");
            const elVote = document.createElement("p");

            elDiv.appendChild(elTitle);
            elDiv.appendChild(elImage);
            elDiv.appendChild(elGenres);
            elDiv.appendChild(elVote);
            this.container.appendChild(elDiv);

            // add filters to this
            //- A filter dropdown to filter the displayed movies in the home page, based on (popular, relase date, top rated, now playing and up coming)
            if (el.constructor.name === "Movie") { //if movie/tv
                elTitle.innerHTML = `<a href="#">${el.title || el.name}</a>`;

                elImage.src = el.backdropUrl
                const path = el.name ? "tv" : "movie"

                APIService.fetchMovie(path, el.id).then(x => {
                    if (x.genres) {
                        for (const each of x.genres) {
                            elGenres.innerText += " " + each.name
                        }
                    }
                    elVote.textContent = x.vote ? `Rating: ${x.vote}` : ""
                })

                elTitle.addEventListener("click", function () {
                    //console.log(el) //obje veriyor
                    Movies.run(path, el)
                });


            }
            else { //if person 
                elImage.src = el.backdropUrl
                elTitle.innerHTML = `<a href="#">${el.name}</a>`
                elTitle.addEventListener("click", function () {
                    APIService.fetchActor(el.id).then(x => {
                        PersonPage.renderPersonSection(x)
                    })
                });
            }

        })
    }
}


class Movies {
    static async run(path, movie) {
        const movieData = await APIService.fetchMovie(path, movie.id)
        MoviePage.renderMovieSection(movieData);

    }
}
class PersonPage {
    static container = document.getElementById("container")
    static renderPersonSection(person) {
        PersonSection.renderPerson(person);
    }
}
class MoviePage {
    static container = document.getElementById('container');
    static renderMovieSection(movie) {
        MovieSection.renderMovie(movie);
    }
}

class PersonSection {

    static renderPerson(person) {
        PersonPage.container.innerHTML = `
            <div class= "row">
            <div class="col-md-4">
                <img id="movie-backdrop" src=${person.backdropUrl}> 
        </div>
                <div class="col-md-8">
                    <h2 id="person-name">${person.name}</h2>
                    <h3>Biography</h3>
                    <p id="person-biography">${person.biography}</p>
                    <p id="person-birthday">Birthdate: ${person.birthday}</p>
                    <p id="person-deathday">Deathdate: ${person.deathday}</p>
                    <p id="person-known-for">Known for: ${person.known_for_department}</p>
                    <p id="person-famous-roles">Also known as: ${person.also_known_as}</p>
                    <p id="person-birthplace">Birthplace: ${person.place_of_birth}</p>
                    <p id="person-popularity">Popularity score: ${person.popularity}</p>
                    <h3>Movies</h3>
                    <ul id="person-movie-list"></ul>
                </div>
            </div>
    `;

    }
}


class MovieSection {
    static renderMovie(movie) {
        MoviePage.container.innerHTML = `
                <div class= "row">
                <div class="col-md-4">
                    <img id="movie-backdrop" src=${movie.backdropUrl}> 
        </div>
                    <div class="col-md-8">
                        <h2 id="movie-title">${movie.title || movie.name}</h2>
                        <ul id="genres">Genres: </ul>
                        <p id="movie-release-date">${movie.releaseDate}</p>
                        <p id="movie-runtime">${movie.runtime}</p>
                        <p id="movie-lang">Original Language: ${movie.language}</p>
                        <p id="movie-vote">Avg Vote: ${movie.vote ? movie.vote : "unknown"} (${movie.voteCount ? movie.voteCount : "unknown"}) </p>
                        <h4>Director</h4>
                        <p id="movie-director"></p>
                        <h3>Overview:</h3>
                        <p id="movie-overview">${movie.overview}</p>
                        <h4>Actors:</h4>
                        <ol id="fiveActors"></ol>
                        <h4>Production Companies</h4>
                        <ul id="production-company"></ul>
                        <h4>Trailers</h4>
                        <ul id="trailers"></ul>
                        <h4>Similar Movies</h4>
                        <ul id="similar-movies"></ul>
                        <h4>Reviews</h4>
                        <ul id="reviews"></ul>


                    </div>
                </div>
    `;
        const reviews = document.getElementById("reviews")
        const similarList = document.getElementById("similar-movies")
        const directorName = document.getElementById("movie-director")
        const fiveActors = document.getElementById("fiveActors")
        const genres = document.getElementById("genres")
        const trailers = document.getElementById("trailers")
        const productionCompany = document.getElementById("production-company")
        for (const eachGenre of movie.genres) {
            genres.innerHTML += `<li> ${eachGenre.name}</li>`
        }
        for (const eachTrailer of movie.videos.results) {
            trailers.innerHTML += `<li>
            <div class="embed-responsive embed-responsive-16by9">
                <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/${eachTrailer.key}" allowfullscreen></iframe>
            </div>
            </li>`
        }
        for (const eachComp of movie.productionCompany) {
            if (eachComp.logo_path) {
                productionCompany.innerHTML += `<li><h5>${eachComp.name}</h5><img src="http://image.tmdb.org/t/p/original${eachComp.logo_path}" width=100px ></li >`

            } else {
                productionCompany.innerHTML += `<li><h5>${eachComp.name}</h5></li > `
            }
        }

        const path = movie.title ? "movie" : "tv"
        APIService.fetchCredits(path, movie).then(resp => {
            console.log(resp)
            for (let i = 0; i < 5; i++) {
                fiveActors.innerHTML += `<li class="person" id ="${resp.cast[i].id}" > <a href="#">${resp.cast[i].name} as ${resp.cast[i].character}</a></li>`
            }
            const director = resp.crew.find(x => x.job == "Director" || x.job == "Executive Producer")
            directorName.innerHTML = `<p class="person" id =${director.id}><a href="#">${director.name}</a></p>`

            const people = document.getElementsByClassName("person")
            //event listener on Tv doesnt work
            for (const each of people) {
                each.addEventListener("click", (e) => {

                    APIService.fetchActor(each.id).then(personObj => {
                        PersonPage.renderPersonSection(personObj)
                    })
                })
            }
        })

        APIService.getSimilar(path, movie).then(similarMovies => {
            // creates li and sets their classes, ids and returns HTMLCollection
            for (const each of similarMovies) {
                similarList.innerHTML += `<li class="similar" id ="${each.id}"> <a href="#">${each.title || each.name}</a></li >`
            }
            return document.getElementsByClassName("similar")
        }).then((x) => {
            //x is htmlcollection
            for (const each of x) {
                each.addEventListener("click", async function () {
                    const id = parseInt(each.id) // for each element turns id into int
                    const data = await APIService.fetchMovie(path, id) // calls data with id
                    MovieSection.renderMovie(data) // puts it on screen
                })
            }
        })

        APIService.fetchReviews(path, movie).then(resp => {
            for (const eachReview of resp.reviews.results) {
                reviews.innerHTML += `<li >
            <h6>${eachReview.author}</h6>
            <p>${eachReview.content}</p>
                </li > `
            }
        })
    }

}

class Movie {
    static BACKDROP_BASE_URL = 'http://image.tmdb.org/t/p/w500';
    constructor(json) {
        this.id = json.id;
        this.title = json.title;
        this.releaseDate = json.release_date;
        this.runtime = json.runtime + " minutes";
        this.overview = json.overview;
        this.backdropPath = json.backdrop_path || json.posterPath || json.poster_path;
        this.genres = json.genres;
        this.videos = json.videos;
        this.productionCompany = json.production_companies;
        this.language = json.original_language;
        this.vote = json.vote_average;
        this.voteCount = json.vote_count;
        this.name = json.name
    }

    get backdropUrl() {
        return this.backdropPath ? Movie.BACKDROP_BASE_URL + this.backdropPath : "output-onlinepngtools.png";
    }
}

class Person {
    static BACKDROP_BASE_URL = 'http://image.tmdb.org/t/p/w780';
    constructor(json) {
        this.id = json.id;
        this.name = json.name;
        this.birthday = json.birthday;
        this.deathday = json.deathday;
        this.biography = json.biography;
        this.place_of_birth = json.place_of_birth;
        this.profile_path = json.profile_path;
        this.known_for_department = json.known_for_department;
        this.also_known_as = json.also_known_as;
        this.popularity = json.popularity;
    }
    get backdropUrl() {
        return this.profile_path ? Person.BACKDROP_BASE_URL + this.profile_path : "output-onlinepngtools.png";
    }
}



document.addEventListener("DOMContentLoaded", App.run);


// some videos are not acutally trailers
// TV detaylar
// Movie detaylar
// oyuncu detaylar
// page number
// director producer details director ve producer birden fazla olabilir.
// filter
// footer
// add actor gender
// add movies of the actor
// style
