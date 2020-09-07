//the API documentation site https://developers.themoviedb.org/3/

class App {
    static async run() {
        const movies = await APIService.fetchMultiple()
        HomePage.renderHomepageContent(movies);
        HomePage.renderNav()

    }
}



class APIService {
    static TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    static _constructUrl(path, append = "", item = "") {
        return `${this.TMDB_BASE_URL}/${path}?api_key=${'50263a781de21add754e80576984b3e5'}${append + item}`;
    }


    static async fetchMultiple(type = "movie", path = "now_playing") {
        const url = APIService._constructUrl(`${type}/${path}`)
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async each => await this.fetchSingle(type, each.id))
        return Promise.all(detailedData)
    }


    static async fetchSingle(type, id) {
        const url = APIService._constructUrl(`${type}/${id}`, "&append_to_response=", "videos,reviews,credits,similar,combined_credits")
        const response = await fetch(url)
        const data = await response.json()

        if (type === "tv") {
            return new TV(data)
        }
        else if (type === "movie") {
            return new Movie(data)
        }
        else {
            return new Person(data)
        }

    }


    static async search() {
        const searchInput = document.getElementById("searchBox").value
        const searchStr = searchInput.trim().replace(" ", "+")
        const queryUrl = APIService._constructUrl("search/multi") + `&query=${searchStr}` + `&page=1&include_adult=false`
        const queryResponse = await fetch(queryUrl)
        const queryData = await queryResponse.json()

        const detailedQueryData = queryData.results.map(async each => {
            if (each.media_type === "tv" || each.media_type === "movie") {
                return await this.fetchSingle(each.media_type, each.id)
            }
            else {
                return await APIService.fetchSingle("person", each.id)
            }
        })
        return Promise.all(detailedQueryData)
    }



    static async fetchFilter(releaseDate = "", genreId = "", path = "movie", sortBy = "popularity.desc", with_cast = "") {
        const constructorUrl = APIService._constructUrl(`discover/${path}`)
        const sort = `&sort_by=${sortBy}`
        const genre = genreId === "" ? "" : `&with_genres=${genreId}`
        const release = releaseDate === "" ? "" : `&release_date.lte=${releaseDate}`
        const withCast = with_cast === "" ? "" : `&with_people=${with_cast}`
        const url = constructorUrl + release + genre + sort + "&include_video=true" + withCast
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async each => this.fetchSingle(path, each.id))
        return Promise.all(detailedData)
    }




    static async fetchGenres(path) {
        const url = APIService._constructUrl(`genre/${path}/list`)
        const response = await fetch(url)
        const data = await response.json()
        return data.genres
    }

    static async fetchPopularStars() {
        const url = APIService._constructUrl(`person/popular`)
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(each => APIService.fetchSingle("person", each.id))
        return Promise.all(detailedData)
    }
}





class HomePage {
    static arrMovies = "";
    static container = document.getElementById('container');


    static async renderNav() {

        const popularStars = document.getElementById("popularStars")
        const about = document.getElementById("about")
        const searchButton = document.getElementById("searchButton")
        const dateInput = document.getElementById("example-date-input")
        const releaseDateRadio = document.getElementById("releaseDate")
        const filterSearchButton = document.getElementById("filterSearch")
        const filterRadioPaths = document.getElementsByClassName("path")
        const filterRadioTypes = document.getElementsByClassName("type")



        filterSearchButton.addEventListener("click", async (a) => {
            let path = ""
            let type = ""
            let data = ""

            a.preventDefault()

            for (const each of filterRadioTypes) {
                if (each.checked) {
                    type = each.value


                }
            }

            for (const each of filterRadioPaths) {
                if (each.checked) {
                    path = each.id

                }
            }

            if (path === "releaseDate") {
                path = dateInput.value
                data = await APIService.fetchFilter(path, "", type, "release_date.desc")
                HomePage.renderHomepageContent(data)
            }
            else if (type === "tv") {

                if (path === "now_playing") {
                    data = await APIService.fetchMultiple(type, "airing_today")
                }
                else if (path === "upcoming") {
                    data = await APIService.fetchMultiple(type, "on_the_air")
                }
                else {
                    data = await APIService.fetchMultiple(type, path)
                }
                HomePage.renderHomepageContent(data)

            }
            else {
                data = await APIService.fetchMultiple(type, path)
                HomePage.renderHomepageContent(data)
            }

        })

        dateInput.addEventListener("click", (e) => {
            releaseDateRadio.click()
        })


        const genreDropdown = async (type) => {
            const navBarEl = type === "tv" ? document.getElementById("tv-dropdown") : document.getElementById("movie-dropdown")
            const genresArr = await APIService.fetchGenres(type)
            for (const each of genresArr) {
                navBarEl.innerHTML += `<a class="dropdown-item ${type}-genre" id=${each.id} href="#">${each.name}</a>`
            }

            const genreClasses = document.getElementsByClassName(`${type}-genre`)

            for (const each of genreClasses) {
                each.addEventListener("click", async () => {
                    const result = await APIService.fetchFilter("", `${each.id}`, type, "popularity.desc")
                    HomePage.renderHomepageContent(result)
                })
            }
        }

        genreDropdown("movie")
        genreDropdown("tv")

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





        popularStars.addEventListener("click", async (e) => {
            e.preventDefault()
            const popularStars = await APIService.fetchPopularStars()
            HomePage.renderHomepageContent(popularStars)
        })


    }

    static renderHomepageContent(arr) {
        this.container.innerHTML = ""
        this.arrMovies = arr
        arr.forEach(async el => {

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


            let type = ""
            if (el.constructor.name === "TV") {
                type = "tv"
            }
            else if (el.constructor.name === "Movie") {
                type = "movie"
            }
            else {
                type = "person"
            }

            if (type === "movie" || type === "tv") { //if movie/tv
                elTitle.innerHTML = `<a href="#">${el.title || el.name || el.original_name}</a>`;
                elImage.src = el.backdropUrl
                elVote.textContent = el.vote ? `Rating: ${el.vote}` : ""

                if (el.genres) {
                    for (const each of el.genres) {
                        elGenres.innerText += " " + each.name
                    }
                }

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
        const movieData = await APIService.fetchSingle("movie", movie.id)
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

        const personOtherWorkUl = document.getElementById("person-movie-list")
        const personOtherWork = document.getElementsByClassName("personOtherWork")

        if (person.cast.length > 0)
            person.cast.forEach(eachCredit => {
                personOtherWorkUl.innerHTML += `<li class="personOtherWork" id="${eachCredit.id} ${eachCredit.media_type}"><a href="#">${eachCredit.title || eachCredit.name}</a></li>`

            })

        if (person.crew.length > 0) {
            person.crew.forEach(eachCredit => {
                personOtherWorkUl.innerHTML += `<li class="personOtherWork" id="${eachCredit.id} ${eachCredit.media_type}"><a href="#">${eachCredit.title || eachCredit.name}</a></li>`
            })
        }
        for (const eachClass of personOtherWork) {
            eachClass.addEventListener("click", async (e) => {
                const data = await APIService.fetchSingle(eachClass.id.split(" ")[1], parseInt(eachClass.id.split(" ")[0])) //?
                MovieSection.renderMovie(data)
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
                        <ol id="credits"></ol>
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
        const credits = document.getElementById("credits") //
        const genres = document.getElementById("genres")
        const trailers = document.getElementById("trailers")
        const productionCompany = document.getElementById("production-company")
        const similarClass = document.getElementsByClassName("similar")
        const people = document.getElementsByClassName("person")
        const type = movie.constructor.name === "TV" ? "tv" : "movie"

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
        // movie.cast
        if (movie.cast.length > 0) {
            movie.cast.forEach(each => {
                credits.innerHTML += `<li class="person" id ="${each.id}" > <a href="#">${each.name}</a> as ${each.character}</li>`
            })
        }

        if (movie.crew.length > 0) {
            const director = movie.crew.find(x => x.job == "Director" || x.job == "Executive Producer")
            directorName.innerHTML = `<p class="person" id =${director.id}><a href="#">${director.name}</a></p>`
        }


        for (const each of people) {
            each.addEventListener("click", async (e) => {
                const data = await APIService.fetchSingle("person", each.id)
                PersonPage.renderPersonSection(data)
            })
        }




        movie.similar.map(each => {
            similarList.innerHTML += `<li class="similar" id="${each.id}" path="${each.constructor.name}"><a href="#">${each.title || each.name}</a></li>`
        })

        for (const each of similarClass) {
            each.addEventListener("click", async e => {
                const data = await APIService.fetchSingle(type, each.id)
                MovieSection.renderMovie(data)
            })
        }



        for (const eachReview of movie.reviews) {
            reviews.innerHTML += `<li>
            <h6>${eachReview.author}</h6>
            <p>${eachReview.content}</p>
                </li>`
        }

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
        this.reviews = json.reviews !== undefined ? json.reviews.results : ""
        this.videos = json.videos !== undefined ? json.videos.results : ""
        this.cast = json.credits !== undefined ? json.credits.cast : ""
        this.crew = json.credits !== undefined ? json.credits.crew : ""
        this.similar = json.similar !== undefined ? json.similar.results : ""
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
        this.reviews = json.reviews !== undefined ? json.reviews.results : ""
        this.videos = json.videos !== undefined ? json.videos.results : ""
        this.cast = json.credits !== undefined ? json.credits.cast : ""
        this.crew = json.credits !== undefined ? json.credits.crew : ""
        this.similar = json.similar !== undefined ? json.similar.results : ""
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
        this.cast = json.combined_credits !== undefined ? json.combined_credits.cast : ""
        this.crew = json.combined_credits !== undefined ? json.combined_credits.crew : ""
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


// geri butonu
// page number
// filter bazen düzensiz veriyor