//the API documentation site https://developers.themoviedb.org/3/

class App {
    static async run() {
        const movies = await APIService.fetchMultiple()
        HomePage.renderHomepageContent(movies);
        HomePage.renderNav()

    }
}


// Beginning of API Service
class APIService {
    static TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    //creates base url for fethces
    static _constructUrl(path, append = "", item = "") {
        return `${this.TMDB_BASE_URL}/${path}?api_key=${'50263a781de21add754e80576984b3e5'}${append + item}`;
    }

    //fetches multiple movies for filter button
    static async fetchMultiple(type = "movie", path = "now_playing") {
        const url = APIService._constructUrl(`${type}/${path}`)
        const response = await fetch(url)
        const data = await response.json()
        const detailedData = data.results.map(async each => await this.fetchSingle(type, each.id))
        return Promise.all(detailedData)
    }

    // fetches singular person/tv/movie
    static async fetchSingle(type, id) {
        let output = ""
        const url = APIService._constructUrl(`${type}/${id}`, "&append_to_response=", "videos,reviews,credits,similar,combined_credits")
        const response = await fetch(url)
        const data = await response.json()
        if (type === "tv") {
            output = new TV(data)
        }
        else if (type === "movie") {
            output = new Movie(data)
        }
        else {
            output = new Person(data)
        }
        console.log(output)
        return output

    }

    //search by string
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


    //Filtered search function
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



    // fetches all known genres (unrelated to a movie/tv/person)
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
// End of API Service




// Beginning of homepage
class HomePage {
    static arrMovies = "";
    static container = document.getElementById('container');

    // Beginning of NAV renderer
    static async renderNav() {
        const popularStars = document.getElementById("popularStars")
        const about = document.getElementById("about")
        const searchButton = document.getElementById("searchButton")
        const dateInput = document.getElementById("example-date-input")
        const releaseDateRadio = document.getElementById("releaseDate")
        const filterSearchButton = document.getElementById("filterSearch")
        const filterRadioPaths = document.getElementsByClassName("path")
        const filterRadioTypes = document.getElementsByClassName("type")


        //Beginning of filter button 
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
        //End of filter button 

        //Makes clicking on calendar also click on radio
        dateInput.addEventListener("click", (e) => {
            releaseDateRadio.click()
        })


        //Beginning genre dropdown generator
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
        //End genre dropdown generator
        genreDropdown("movie")
        genreDropdown("tv")


        //Beginning of about page
        about.addEventListener("click", (e) => {
            this.container.innerHTML = `<h3>About</h3>
            
            <p> Lorem ipsum  Quisque id tellus euismod, interdum mi ac, mattis ligula. Ut scelerisque luctus ex, sit amet aliquet tortor faucibus sed. Suspendisse dignissim augue leo, quis varius tellus lobortis quis. Ut vehicula id tellus nec congue. Duis pharetra massa vitae congue luctus. Mauris a semper nunc, eu lobortis ante. Morbi tempor, lectus in varius porta, est erat imperdiet magna, id molestie felis erat non eros. Nullam tellus ligula, rhoncus in tempus in, finibus vitae felis. Donec aliquam fermentum aliquam. Phasellus elementum, purus nec eleifend interdum, libero neque varius tellus, in volutpat nunc sem ac elit. Aliquam ornare posuere iaculis. Quisque sit amet libero iaculis, dictum ligula at, placerat enim. Etiam egestas quam dictum, lacinia libero eu, euismod felis. Morbi feugiat vulputate odio id pretium. Nunc rutrum auctor velit.  </p>
            <p> Lorem ipsum  Quisque id tellus euismod, interdum mi ac, mattis ligula. Ut scelerisque luctus ex, sit amet aliquet tortor faucibus sed. Suspendisse dignissim augue leo, quis varius tellus lobortis quis. Ut vehicula id tellus nec congue. Duis pharetra massa vitae congue luctus. Mauris a semper nunc, eu lobortis ante. Morbi tempor, lectus in varius porta, est erat imperdiet magna, id molestie felis erat non eros. Nullam tellus ligula, rhoncus in tempus in, finibus vitae felis. Donec aliquam fermentum aliquam. Phasellus elementum, purus nec eleifend interdum, libero neque varius tellus, in volutpat nunc sem ac elit. Aliquam ornare posuere iaculis. Quisque sit amet libero iaculis, dictum ligula at, placerat enim. Etiam egestas quam dictum, lacinia libero eu, euismod felis. Morbi feugiat vulputate odio id pretium. Nunc rutrum auctor velit.  </p>
            <p> Lorem ipsum  Quisque id tellus euismod, interdum mi ac, mattis ligula. Ut scelerisque luctus ex, sit amet aliquet tortor faucibus sed. Suspendisse dignissim augue leo, quis varius tellus lobortis quis. Ut vehicula id tellus nec congue. Duis pharetra massa vitae congue luctus. Mauris a semper nunc, eu lobortis ante. Morbi tempor, lectus in varius porta, est erat imperdiet magna, id molestie felis erat non eros. Nullam tellus ligula, rhoncus in tempus in, finibus vitae felis. Donec aliquam fermentum aliquam. Phasellus elementum, purus nec eleifend interdum, libero neque varius tellus, in volutpat nunc sem ac elit. Aliquam ornare posuere iaculis. Quisque sit amet libero iaculis, dictum ligula at, placerat enim. Etiam egestas quam dictum, lacinia libero eu, euismod felis. Morbi feugiat vulputate odio id pretium. Nunc rutrum auctor velit.  </p>`
        })
        //End of about page

        //Beginning of searh button evt list
        searchButton.addEventListener("click", async function (e) {
            e.preventDefault()
            const results = await APIService.search()
            HomePage.renderHomepageContent(results)
        })
        //End of searh button evt list

        //Beginning of popularstars button evt list
        popularStars.addEventListener("click", async (e) => {
            e.preventDefault()
            const popularStars = await APIService.fetchPopularStars()
            HomePage.renderHomepageContent(popularStars)
        })
        //End of popularstars button evt list
    }
    // End of NAV rendere

    // Beginning of home page content renderer
    static renderHomepageContent(arr) {
        this.container.innerHTML = ""
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

            //Beginning of content deciding
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
            //End of content deciding

            //Beginning of TV Movie content
            if (type === "movie" || type === "tv") {
                elTitle.innerHTML = `<a href="#">${el.title || el.name || el.original_name}(${el.releaseDate.split("-")[0]})</a>`;
                elImage.src = el.backdropUrl
                elVote.textContent = el.vote ? `Rating: ${el.vote} (${el.voteCount} votes)` : ""

                if (el.genres) {
                    elGenres.innerText += "Genres: "
                    for (const each of el.genres) {
                        elGenres.innerText += ` ${each.name}`
                    }
                }

                elTitle.addEventListener("click", function () {
                    MovieSection.renderMovie(el)
                });

            }
            //End of TV Movie content

            //Beginning of Person content
            else {
                elImage.src = el.backdropUrl
                elTitle.innerHTML = `<a href="#">${el.name}</a>`
                elTitle.addEventListener("click", function () {
                    PersonSection.renderPerson(el)
                });
            }
        })
        //End of Person content

    }
    // End of home page content renderer
}
// End of homepage

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



//Beginning of single person page
class PersonSection {
    static async renderPerson(person) {


        PersonPage.container.innerHTML = `
            <div class= "row">
            <div class="col-md-4">
                <img id="movie-backdrop" src=${person.backdropUrl}> 
        </div>
                <div class="col-md-8">
                    <h2 id="person-name">${person.name}</h2>
                    <p id="person-popularity">Popularity score: ${person.popularity ? person.popularity : "Unknown"}</p>
                    <p id="person-known-for">${person.known_for_department ? "Known for: " + person.known_for_department : ""}</p>
                    <p id="person-famous-roles">${person.also_known_as ? "Also known as: " + person.also_known_as : ""}</p>
                    <h3>Biography</h3>
                    <p id="person-biography">${person.biography ? person.biography : "Unknown"}</p>
                    <p id="person-gender">Gender:${person.gender == 2 ? "Male" : "Female"}</p>
                    <p id="person-birthday">${person.birthday ? "Birthdate: " + person.birthday : "Unknown"}</p>
                    <p id="person-deathday">${person.deathday ? "Date of Death: " + person.deathday : ""}</p>
                    
                    
                    <p id="person-birthplace">Birthplace: ${person.place_of_birth ? person.place_of_birth : "Unknown"}</p>
                    
                    <h3>${person.name}'s Other Works:</h3>
                    <ul id="person-movie-list"></ul>
                </div>
            </div>
    `;

        const personOtherWorkUl = document.getElementById("person-movie-list")
        const personOtherWork = document.getElementsByClassName("personOtherWork")
        //Beginning of person's other works
        if (person.cast.length > 0 || person.crew.length > 0) {
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
        else {
            personOtherWorkUl.innerHTML = "<p>Unknown</p>"
        }

        //End of person's other works
    }
}
//End of single person page


// Beginning of single movie page
class MovieSection {
    static async renderMovie(movie) {
        MoviePage.container.innerHTML = `
                <div class= "row">
                <div class="col-md-4">
                    <img id="movie-backdrop" src=${movie.backdropUrl}> 
        </div>
                    <div class="col-md-8">
                        <h2 id="movie-title">${movie.title || movie.name}</h2>
                        <h5>${movie.tagline}</h5>
                        <h4>Genres:</h4>
                        <ul id="genres"></ul>
                        <p id="movie-release-date">Release Date: ${movie.releaseDate ? movie.releaseDate : "Unknown"}</p>
                        <p id="movie-runtime">Runtime: ${movie.runtime ? movie.runtime + " minutes" : "Unknown"}</p>
                        <p id="movie-lang">Original Language: ${movie.language ? movie.language : "Unknown"}</p>
                        <p id="movie-vote">Avg Vote: ${movie.vote ? movie.vote : "Unknown"} (${movie.voteCount ? movie.voteCount : "Unknown"}) </p>
                        <p>Popularity Score: ${movie.popularity ? movie.popularity : "Unknown"}</p>
                        <p>Budget: ${movie.budget !== 0 ? movie.budget + "$" : "Unknown"} </p>
                        <p>Revenue: ${movie.revenue !== 0 ? movie.revenue + "$" : "Unknown"}</p>
                        <h4>Director</h4>
                        <div id="movie-director"></div>
                        <h3>Overview:</h3>
                        <p id="movie-overview">${movie.overview ? movie.overview : "Unknown"}</p>
                        <h4>Cast:</h4>
                        <ul id="cast"></ul>
                        <h4>Production Companies</h4>
                        <ul id="production-company"></ul>
                        <h4>Trailers</h4>
                        <ul id="trailers"></ul>
                        <h4>Similar:</h4>
                        <ul id="similar-movies"></ul>
                        <h4>Reviews</h4>
                        <ul id="reviews"></ul>


                    </div>
                </div>
    `;
        const reviews = document.getElementById("reviews")
        const similarList = document.getElementById("similar-movies")
        const directorName = document.getElementById("movie-director")
        const cast = document.getElementById("cast")
        const genres = document.getElementById("genres")
        const trailers = document.getElementById("trailers")
        const productionCompany = document.getElementById("production-company")
        const similarClass = document.getElementsByClassName("similar")
        const people = document.getElementsByClassName("person")
        const type = movie.constructor.name === "TV" ? "tv" : "movie"

        //Beginning of genre list
        if (movie.genres.length > 0) {
            for (const eachGenre of movie.genres) {
                genres.innerHTML += `<li> ${eachGenre.name}</li>`
            }
        }
        else {
            genres.innerHTML = "<p>Unknown</p>"
        }
        //End of genre list

        //Beginning of Video list
        if (movie.videos.length > 0) {
            for (const eachTrailer of movie.videos) {
                trailers.innerHTML += `<li>
                <div class="embed-responsive embed-responsive-16by9">
                    <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/${eachTrailer.key}" allowfullscreen></iframe>
                </div>
                </li>`
            }
        }
        else {
            trailers.innerHTML += "<p>No videos yet!</p>"
        }
        //End of Video list

        //Beginning of Production Company List
        if (movie.productionCompanies.length > 0) {
            for (const eachComp of movie.productionCompanies) {
                if (eachComp.logo_path) {
                    productionCompany.innerHTML += `<li><h5>${eachComp.name}</h5><img src="http://image.tmdb.org/t/p/original${eachComp.logo_path}" width=100px ></li >`

                } else {
                    productionCompany.innerHTML += `<li><h5>${eachComp.name}</h5></li > `
                }
            }
        }
        else {
            productionCompany.innerHTML = "<p>Unknown</p>"
        }
        //End of Production company list

        //Beginning of Director
        if (movie.crew.length > 0) {
            const director = movie.crew.find(x => x.job == "Director" || x.job == "Executive Producer")
            directorName.innerHTML = `<p class="person" id =${director.id}><a href="#">${director.name}</a></p>`
        }
        else {
            directorName.innerHTML = "<p>Unknown</p>"
        }
        //End of Director

        // Beginning of Movie Cast
        if (movie.cast.length > 0) {
            movie.cast.forEach(each => {
                cast.innerHTML += `<li class="crew" id ="${each.id}" > <a href="#">${each.name}</a> as ${each.character}</li>`
            })
        }
        else {
            cast.innerHTML = "<p>Unknown</p>"
        }

        for (const each of people) {
            each.addEventListener("click", async (e) => {
                const data = await APIService.fetchSingle("person", each.id)
                PersonPage.renderPersonSection(data)
            })
        }
        //End of Movie Cast



        //Beginning of Similar list
        if (movie.similar.length > 0) {
            movie.similar.map(each => {
                similarList.innerHTML += `<li class="similar" id="${each.id}" path="${each.constructor.name}"><a href="#">${each.title || each.name}</a></li>`
            })
        }
        else {
            similarList.innerHTML = "<p>There is nothing like it!</p>"
        }


        for (const each of similarClass) {
            each.addEventListener("click", async e => {
                const data = await APIService.fetchSingle(type, each.id)
                MovieSection.renderMovie(data)
            })
        }

        //End of Similar list

        //Beginning of Review list
        if (movie.reviews.length > 0) {
            for (const eachReview of movie.reviews) {
                reviews.innerHTML += `<li>
                <h6>${eachReview.author}</h6>
                <p>${eachReview.content}</p>
                    </li>`
            }
        }
        else {
            reviews.innerHTML = `<p>No reviews yet!</p>`
        }
        //End of Review list

    }

}

// End of sinlge movie page


// Beginning of movie class
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
// End of movie class

// Beginning of tv class
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
// End of movie class


// Beginning of person class
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

// End of movie class


document.addEventListener("DOMContentLoaded", App.run);





// some videos are not acutally trailers
// director producer details director ve producer birden fazla olabilir.
// footer
// style



// geri butonu
// page number
// filter bazen düzensiz veriyor