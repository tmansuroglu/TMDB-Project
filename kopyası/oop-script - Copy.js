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

    static _constructUrl(path, append = "", item = "") {
        return `${this.TMDB_BASE_URL}/${path}?api_key=${'50263a781de21add754e80576984b3e5'}${append + item}`;
    }

    static async fetchPersonCombinedCredits(personId) {
        const url = APIService._constructUrl(`person/${personId}/combined_credits`)
        const response = await fetch(url)
        const data = await response.json()
        return data.cast.map(x => x.media_type === "tv" ? new TV(x) : new Movie(x))
    }




    static async fetchMovies(type = "now_playing") {
        const url = APIService._constructUrl(`movie/${type}`)
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async x => await APIService.fetchMovie(x.id))
        return Promise.all(detailedData)
    }
    static async fetchTVs(type = "now_playing") {
        const url = APIService._constructUrl(`tv/${type}`)
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async x => await APIService.fetchTV(x.id))
        return Promise.all(detailedData)
    }




    static async fetchMovie(movieId) {
        const url = APIService._constructUrl(`movie/${movieId}`, "&append_to_response=", "videos,reviews,credits,similar")
        const response = await fetch(url)
        const data = await response.json()
        return new Movie(data)
    }
    static async fetchTV(tvId) {
        const url = APIService._constructUrl(`tv/${tvId}`, "&append_to_response=", "videos,reviews,credits,similar")
        const response = await fetch(url)
        const data = await response.json()

        return new TV(data)
    }




















    static async search() {
        const searchInput = document.getElementById("searchBox").value
        const searchStr = searchInput.trim().replace(" ", "+")
        const queryUrl = APIService._constructUrl("search/multi") + `&query=${searchStr}` + `&page=1&include_adult=false`
        const queryResponse = await fetch(queryUrl)
        const queryData = await queryResponse.json()

        const detailedQueryData = queryData.results.map(async x => {
            if (x.media_type === "tv") {
                return await APIService.fetchTV(x.id)
            }
            else if (x.media_type === "movie") {

                return await APIService.fetchMovie(x.id)
            }
            else {
                return await APIService.fetchActor(x.id)
            }
        })

        return Promise.all(detailedQueryData)

    }



    static async fetchFilter(releaseDate = "", genreId = "", type = "movie", sortBy = "popularity.desc", with_cast = "") {
        const constructorUrl = APIService._constructUrl(`discover/${type}`)
        const sort = `&sort_by=${sortBy}`
        const genre = genreId === "" ? "" : `&with_genres=${genreId}`
        const release = releaseDate === "" ? "" : `&release_date.lte=${releaseDate}`
        const withCast = with_cast === "" ? "" : `&with_people=${with_cast}`
        const url = constructorUrl + release + genre + sort + "&include_video=true" + withCast
        const response = await fetch(url)
        const data = await response.json()

        const detailedData = data.results.map(async x => type === "movie" ? await APIService.fetchMovie(x.id) : await APIService.fetchTV(x.id))
        return Promise.all(detailedData)
    }



    static async fetchMovieCredits(movie) {
        const url = APIService._constructUrl(`movie/${movie.id}/credits`)
        const response = await fetch(url)
        const data = await response.json()
        return data
    }

    static async fetchTvCredits(tv) {
        const url = APIService._constructUrl(`tv/${tv.id}/credits`)
        const response = await fetch(url)
        const data = await response.json()
        return data
    }

    static async getSimilarMovies(movie) {
        const url = APIService._constructUrl(`movie/${movie.id}/similar`, "&append_to_response=", "videos")
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async x => APIService.fetchMovie(x.id))
        return Promise.all(detailedData)
    }

    static async getSimilarTv(tv) {
        const url = APIService._constructUrl(`tv/${tv.id}/similar`, "&append_to_response=", "videos")
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async x => APIService.fetchTV(x.id))
        return Promise.all(detailedData)
    }

    static async fetchMovieReviews(movie) {
        const url = APIService._constructUrl(`movie/${movie.id}/reviews`)
        const response = await fetch(url)
        const data = await response.json()
        return data
    }

    static async fetchTvReviews(tv) {
        const url = APIService._constructUrl(`tv/${tv.id}/reviews`)
        const response = await fetch(url)
        const data = await response.json()
        return data
    }






    static async fetchActor(personId) {
        const url = APIService._constructUrl(`person/${personId}`, "&append_to_response=", "combined_credits")
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
        const url = APIService._constructUrl(`person/popular`)
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(x => APIService.fetchActor(x.id))
        return Promise.all(detailedData)
    }
}





class HomePage {


    static arrMovies = "";
    static container = document.getElementById('container');




    static async renderNav() {
        const movieGenres = document.getElementById("movie-dropdown")
        const tvGenres = document.getElementById("tv-dropdown")
        const actorActresses = document.getElementById("actorActresses")
        const about = document.getElementById("about")
        const searchButton = document.getElementById("searchButton")
        const dateInput = document.getElementById("example-date-input")
        const releaseRadio = document.getElementById("releaseDate")
        const paths = document.getElementsByClassName("path")
        const filterSearchButton = document.getElementById("filterSearch")
        const types = document.getElementsByClassName("type")





        filterSearchButton.addEventListener("click", async (a) => {
            let path = ""
            let type = ""
            let data = ""
            a.preventDefault()
            for (const each of paths) {
                if (each.checked) {
                    path = each.value
                }

            }
            for (const each of types) {
                if (each.checked) {
                    type = each.id
                }
            }
            if (type === "releaseDate") {
                type = dateInput.value
                data = await APIService.fetchFilter(type, "", path, "release_date.desc")
                HomePage.renderHomepageContent(data)
            }
            else if (path === "tv") {
                if (type === "now_playing") {
                    data = await APIService.fetchTVs("airing_today")
                }
                else if (type === "upcoming") {
                    data = await APIService.fetchTVs("on_the_air")
                }
                else {
                    data = await APIService.fetchTVs(type)
                }
                HomePage.renderHomepageContent(data)

            }
            else {
                data = await APIService.fetchMovies(type)
                HomePage.renderHomepageContent(data)
            }

        })

        dateInput.addEventListener("click", (e) => {
            releaseRadio.click()
        })










        //creates genre list for movies

        APIService.fetchGenres("movie").then(genreList => {
            for (const each of genreList) {
                movieGenres.innerHTML += `<a class="dropdown-item movie-genre" id=${each.id} href="#">${each.name}</a>`
            }
            const movieGenre = document.getElementsByClassName("movie-genre")
            for (const each of movieGenre) {
                each.addEventListener("click", async function () {

                    const result = await APIService.fetchFilter("", `${each.id}`, "movie", "popularity.desc")

                    HomePage.renderHomepageContent(result)

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
                    const result = await APIService.fetchFilter("", `${each.id}`, "tv", "popularity.desc")



                    HomePage.renderHomepageContent(result)
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
        this.arrMovies = obj

        obj.forEach(el => {

            const elDiv = document.createElement("div");
            const elImage = document.createElement("img");
            const elTitle = document.createElement("h3");
            const elGenres = document.createElement("p");
            const elVote = document.createElement("p");

            elDiv.appendChild(elTitle);
            elDiv.appendChild(elImage);
            elDiv.appendChild(elGenres);
            elDiv.appendChild(elVote);
            this.container.appendChild(elDiv);



            let path = ""
            if (el.constructor.name === "TV") {
                path = "tv"
            }
            else if (el.constructor.name === "Movie") {
                path = "movie"
            }
            else {
                path = "person"
            }

            if (path === "movie" || path === "tv") { //if movie/tv
                elTitle.innerHTML = `<a href="#">${el.title || el.name || el.original_name}</a>`;

                elImage.src = el.backdropUrl

                const fetchType = path === "tv" ? APIService.fetchTV : APIService.fetchMovie
                fetchType(el.id).then(x => {
                    if (x.genres) {
                        for (const each of x.genres) {
                            elGenres.innerText += " " + each.name
                        }
                    }
                    elVote.textContent = x.vote ? `Rating: ${x.vote}` : ""
                })

                elTitle.addEventListener("click", function () {

                    MovieSection.renderMovie(el)
                });


            }

            else { //if person 
                elImage.src = el.backdropUrl
                elTitle.innerHTML = `<a href="#">${el.name}</a>`
                elTitle.addEventListener("click", function () {

                    PersonSection.renderPerson(el)
                });
            }
        })

    }

}


class Movies {
    static async run(movie) {
        const movieData = await APIService.fetchMovie(movie.id)
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

    static async renderPerson(person) {


        PersonPage.container.innerHTML = `
            <div class= "row">
            <div class="col-md-4">
                <img id="movie-backdrop" src=${person.backdropUrl}> 
        </div>
                <div class="col-md-8">
                    <h2 id="person-name">${person.name}</h2>
                    <h3>Biography</h3>
                    <p id="person-biography">${person.biography}</p>
                    <p id="person-gender">${person.gender == 2 ? "Male" : "Female"}</p>
                    <p id="person-birthday">${person.birthday ? "Birthdate: " + person.birthday : ""}</p>
                    <p id="person-deathday">${person.deathday ? "Deathday: " + person.deathday : ""}</p>
                    <p id="person-known-for">Known for: ${person.known_for_department}</p>
                    <p id="person-famous-roles">Also known as: ${person.also_known_as}</p>
                    <p id="person-birthplace">Birthplace: ${person.place_of_birth}</p>
                    <p id="person-popularity">Popularity score: ${person.popularity}</p>
                    <h3>Movies</h3>
                    <ul id="person-movie-list"></ul>
                </div>
            </div>
    `;

        const personMovieUL = document.getElementById("person-movie-list")

        const personMoviesArr = await APIService.fetchPersonCombinedCredits(person.id)

        const personMoviesClass = document.getElementsByClassName("personMovies")

        personMoviesArr.forEach(x => {

            personMovieUL.innerHTML += `<li class="personMovies" id="${x.id}" path=${x.media_type}><a href="#">${x.title || x.name}</a></li>`

        })
        for (const each of personMoviesClass) {

            const fetchType = each.path === "tv" ? APIService.fetchTV : APIService.fetchMovie

            each.addEventListener("click", async (e) => {

                const result = await fetchType(each.id)

                MoviePage.renderMovieSection(result)


            })
        }
    }
}


class MovieSection {
    static async renderMovie(movie) {

        MoviePage.container.innerHTML = `
                <div class= "row">
                <div class="col-md-4">
                    <img id="movie-backdrop" src=${movie.backdropUrl}> 
        </div>
                    <div class="col-md-8">
                        <h2 id="movie-title">${movie.title || movie.name}</h2>
                        <ul id="genres">Genres: </ul>
                        <p id="movie-release-date">${movie.releaseDate ? movie.releaseDate : ""}</p>
                        <p id="movie-runtime">${movie.runtime ? movie.runtime + "minutes" : ""}</p>
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
        for (const eachTrailer of movie.videos) {
            trailers.innerHTML += `<li>
            <div class="embed-responsive embed-responsive-16by9">
                <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/${eachTrailer.key}" allowfullscreen></iframe>
            </div>
            </li>`
        }
        for (const eachComp of movie.productionCompanies) {
            if (eachComp.logo_path) {
                productionCompany.innerHTML += `<li><h5>${eachComp.name}</h5><img src="http://image.tmdb.org/t/p/original${eachComp.logo_path}" width=100px ></li >`

            } else {
                productionCompany.innerHTML += `<li><h5>${eachComp.name}</h5></li > `
            }
        }
        const fetchCredits = movie.constructor.name === "TV" ? APIService.fetchTvCredits : APIService.fetchMovieCredits
        fetchCredits(movie).then(resp => {
            if (resp.cast.length > 0) {
                for (let i = 0; i < 5; i++) {
                    if (resp.cast[i] === undefined) {
                        break
                    }
                    else {
                        fiveActors.innerHTML += `<li class="person" id ="${resp.cast[i].id}" > <a href="#">${resp.cast[i].name} as ${resp.cast[i].character}</a></li>`
                    }
                }
            }
            if (resp.crew.length > 0) {
                const director = resp.crew.find(x => x.job == "Director" || x.job == "Executive Producer")
                directorName.innerHTML = `<p class="person" id =${director.id}><a href="#">${director.name}</a></p>`
            }






            const people = document.getElementsByClassName("person")
            for (const each of people) {
                each.addEventListener("click", (e) => {

                    APIService.fetchActor(each.id).then(personObj => {
                        PersonPage.renderPersonSection(personObj)
                    })
                })
            }
        })
        const similarClass = document.getElementsByClassName("similar")
        const getSimilar = movie.constructor.name === "TV" ? APIService.getSimilarTv : APIService.getSimilarMovies
        const fetchType = movie.constructor.name === "TV" ? APIService.fetchTV : APIService.fetchMovie
        const similar = await getSimilar(movie)
        similar.map(each => {
            similarList.innerHTML += `<li class="similar" id="${each.id}" path="${each.constructor.name}"><a href="#">${each.title || each.name}</a></li>`
        })

        for (const each of similarClass) {
            each.addEventListener("click", async e => {
                const data = await fetchType(each.id)
                MovieSection.renderMovie(data)
            })
        }
        const fetchReviews = movie.constructor.name === "TV" ? APIService.fetchTvReviews : APIService.fetchMovieReviews

        fetchReviews(movie).then(resp => {
            for (const eachReview of resp.results) {
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
        this.releaseDate = json.release_date
        this.homePage = json.homepage
        this.runtime = json.runtime;
        this.overview = json.overview;
        this.backdropPath = json.backdrop_path
        this.poster_path = json.poster_path
        this.genres = json.genres;
        this.productionCompanies = json.production_companies;
        this.language = json.original_language;
        this.vote = json.vote_average;
        this.voteCount = json.vote_count;
        this.name = json.name
        this.media_type = json.media_type
        this.budget = json.budget
        this.popularity = json.popularity
        this.createdBy = json.created_by
        this.revenue = json.revenue
        this.status = json.status
        this.tagline = json.tagline
        this.reviews = json.reviews.results
        this.videos = json.videos.results
        this.cast = json.credits.cast
        this.crew = json.credits.crew
        this.similar = json.similar.results
    }

    get backdropUrl() {
        if (this.backdropPath) {
            return Movie.BACKDROP_BASE_URL + this.backdropPath
        }
        else if (this.poster_path) {
            return Movie.BACKDROP_BASE_URL + this.poster_path
        }
        else {
            return "output-onlinepngtools.png"
        }
    }
}
// her biri fetch detailden geçtiği için reviews , videos ,credits,similar append olabilir
class TV {
    constructor(json) {
        this.id = json.id;
        this.firstAirDate = json.first_air_date
        this.episodeRunTime = json.episode_run_time;
        this.overview = json.overview;
        this.backdropPath = json.backdrop_path
        this.poster_path = json.poster_path
        this.genres = json.genres;
        this.homePage = json.homepage
        this.inProduction = json.in_production
        this.languages = json.languages
        this.lastAirDate = json.last_air_date
        this.lastEpisodeToAir = json.last_episode_to_air
        this.numEpisodes = json.number_of_episodes
        this.numSeasons = json.number_of_seasons
        this.popularity = json.popularity
        this.seasons = json.seasons
        this.productionCompanies = json.production_companies;
        this.language = json.original_language;
        this.voteAvg = json.vote_average;
        this.voteCount = json.vote_count;
        this.name = json.name
        this.media_type = json.media_type
        this.episodeRunTime = json.episode_run_time
        this.networks = json.networks
        this.createdBy = json.created_by
        this.status = json.status
        this.reviews = json.reviews.results
        this.videos = json.videos.results
        this.cast = json.credits.cast
        this.crew = json.credits.crew
        this.similar = json.similar.results
    }

    get backdropUrl() {
        if (this.backdropPath) {
            return Movie.BACKDROP_BASE_URL + this.backdropPath
        }
        else if (this.poster_path) {
            return Movie.BACKDROP_BASE_URL + this.poster_path
        }
        else {
            return "output-onlinepngtools.png"
        }
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
        this.gender = json.gender;
        this.combined_credits = json.combined_credits
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
// director producer details director ve producer birden fazla olabilir.
// footer
// style
// get movie/TV credits

// geri butonu
// page number
// filter bazen düzensiz veriyor

// TV ve Movie classları ayrıldığı için path belirlemek class isimlerine bağlı olmalı. Böylece TV ve Movie için ayrı ayrı fetch yazmaya gerek kalmaz

// her biri fetch detailden geçtiği için reviews , videos ,credits,similar append olabilir
// persona combined credits eklendi
