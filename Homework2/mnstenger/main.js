// The overall layout of the dashboard was inspired by https://www.opendatasoft.com/wp-content/uploads/2023/03/Blog-thumbnail-1.png.webp

// *******************************************************************************
//                                  MEASUREMENTS
// *******************************************************************************
const width = window.innerWidth;
const height = window.innerHeight;

//let barLeft = 0, barTop = 0;
let barMargin = {top: 0, right: -350, bottom: 95, left: -330},
    barWidth = 400 - barMargin.left - barMargin.right,
    barHeight = 350 - barMargin.top - barMargin.bottom;

//let streamLeft = 0, streamTop = 0;
let streamMargin = {top: 0, right: -350, bottom: 85, left: -200},
    streamWidth = 400 - streamMargin.left - streamMargin.right,
    streamHeight = 350 - streamMargin.top - streamMargin.bottom;

//let pieLeft = 0, pieTop = 0;
let pieMargin = {top: 10, right: 0, bottom: 30, left: 0},
    pieWidth = 150 - pieMargin.left - pieMargin.right,
    pieHeight = 550 - pieMargin.top - pieMargin.bottom;

// *******************************************************************************
//                                  COLOR PALETTE
// *******************************************************************************
// Several colors in this palette were sourced from: https://lospec.com/palette-list/pastel-16 and
// https://jrnold.github.io/ggthemes/reference/tableau_color_pal.html
const colorScale = [
    "#EAB281",
    "#C6577E",
    "#E3E19F",
    "#A9C484",
    "#5D937B",
    "#F290C1",
    "#BFDED8",
    "#A07CA7",
    "#F1C7B7",
    "#4E79A7",
    "#D6CEC2",
    "#A2A6A9",
    "#4E5473",
    "#A3B2D2",
];

// *******************************************************************************
//                               DATA PROCESSING
// *******************************************************************************

// This dataset was sourced from: https://www.kaggle.com/datasets/catherinerasgaitis/mxmh-survey-results
d3.csv("data/mxmh_survey_results.csv").then(data =>{

    // Aggregate the raw data
    data.forEach(function(d){
        // Aggregate ages into groups
        d.Age = (Number(d.Age) >= 10 && Number(d.Age) < 20) ? "10 - 19":
                (Number(d.Age) < 30) ? "20 - 29":
                (Number(d.Age) < 40) ? "30 - 39":
                (Number(d.Age) < 50) ? "40 - 49":
                (Number(d.Age) < 60) ? "50 - 59":
                (Number(d.Age) < 70) ? "60 - 69":
                (Number(d.Age) < 80) ? "70 - 79":
                (Number(d.Age) < 90) ? "80 - 89": 0;
        d.Composer = d.Composer === "Yes";
        // Aggregate the smallest genres into "Other"
        if( d["Fav genre"] == "Gospel" ||
            d["Fav genre"] == "Lofi" ||
            d["Fav genre"] == "Latin" )
        {
            d["Fav genre"] = "Other"
        }
    });

    // Process the aggregated data
    const barData = [];
    const streamData = [];
    const pie1Data = [];
    const pie2Data = [];

    const genres = {};
    const ages = {};
    const genresAndAges = {};
    const composerGenres = {};
    const nonComposerGenres = {};

    // Iterate through all of the data entries
    data.forEach(d =>
    {
        // Process bar chart data
        // Calculate the total number of respondents who answered each genre as their favorite
        if(d["Fav genre"] in genres){
            genres[d["Fav genre"]].respondents = genres[d["Fav genre"]].respondents + 1;
        }
        else {
            // create a new datapoint
            const newGenre = {
                genre: d["Fav genre"],
                respondents: 1
            }
            genres[d["Fav genre"]] = newGenre;
        }

        // Process Stream Chart data
        // Calculate the number of respondents in each age group who answered each genre as their favorite
        if((d["Fav genre"] + d.Age) in genresAndAges){
            genresAndAges[(d["Fav genre"] + d.Age)].respondents = genresAndAges[(d["Fav genre"] + d.Age)].respondents + 1;
        }
        else {
            // create a new datapoint
            const newGenreAndAge = {
                genre: d["Fav genre"],
                age: d.Age,
                respondents: 1
            }
            genresAndAges[(d["Fav genre"] + d.Age)] = newGenreAndAge;
        }

        // Calculate the number of respondents in each age group
        // Will use to the find the percentage of respondents in each age group who answered each genre as their favorite
        if(d.Age in ages){
            ages[d.Age].respondents = ages[d.Age].respondents + 1;
        }
        else {
            // create a new datapoint
            const newAge = {
                age: d.Age,
                respondents: 1
            }
            ages[d.Age] = newAge;
        }

        // Process pie chart 1 data
        // Calculate the number of composers who answered each genre as their favorite
        if(d.Composer){
            if(d["Fav genre"] in composerGenres){
                composerGenres[d["Fav genre"]].respondents = composerGenres[d["Fav genre"]].respondents + 1;
            }
            else {
                // create a new datapoint
                const newGenre = {
                    genre: d["Fav genre"],
                    respondents: 1
                }
                composerGenres[d["Fav genre"]] = newGenre;
            }
        }
        // Process pie chart 2 data
        // Calculate the number of noncomposers who answered each genre as their favorite
        else{
            if(d["Fav genre"] in nonComposerGenres){
                nonComposerGenres[d["Fav genre"]].respondents = nonComposerGenres[d["Fav genre"]].respondents + 1;
            }
            else {
                // create a new datapoint
                const newGenre = {
                    genre: d["Fav genre"],
                    respondents: 1
                }
                nonComposerGenres[d["Fav genre"]] = newGenre;
            }
        }
    })

    // Add all created data points to their corresponding data arrays
    Object.keys(genres).forEach(d => {
        barData.push(genres[d]);
        pie1Data.push(composerGenres[d]);
        pie2Data.push(nonComposerGenres[d]);
    });
    Object.keys(genresAndAges).forEach(d => {
        genresAndAges[d].respondents = genresAndAges[d].respondents / ages[genresAndAges[d].age].respondents * 100;
        streamData.push(genresAndAges[d]);
    });

    // Sort the stream graph data in order of age
    streamData.sort(function(x, y){
        return d3.ascending(x.age, y.age);
    })

    // Put the genres into an array
    let genresArray = [];
    Object.keys(genres).forEach(d => {
        if(genresArray.indexOf(d) === -1){
            genresArray.push(d);
        }
    })

    // Assign a color for each music genre
    const color = d3.scaleOrdinal()
        .domain(genresArray)
        .range(colorScale);

    // *******************************************************************************
    //                                   PLOTS
    // *******************************************************************************


    // *******************************************
    // Plot 1: Overview Bar Chart
    // *******************************************
    // I referenced the following tutorial while completing this chart: https://objectcomputing.com/resources/publications/sett/august-2020-mastering-d3-basics
    const svg_overview = d3.select("#overview")
        .attr("viewBox", `0 0 ${barWidth + barMargin.left + barMargin.right} ${barHeight + barMargin.top + barMargin.bottom}`);

    const g1 = svg_overview.append("g")
        .attr("transform", `translate(${barMargin.left}, ${barMargin.top})`);

    // Title
    g1.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barMargin.top + 55)
        .attr("font-size", "30px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Favorite Music Genres of Respondents");

    // X axis label
    g1.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barHeight + 75)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Genre Name");


    // Y axis label
    g1.append("text")
        .attr("x", barMargin.left + 275)
        .attr("y", barMargin.top + 55)
        .attr("font-size", "20px")
        .attr("text-anchor", "rught")
        .text("Number of Respondents")
        .attr("font-family", "sans-serif");

    // X axis
    const x1 = d3.scaleBand()
        .domain(barData.map(d => d.genre))
        .range([0, barWidth]);

    const xAxisCall1 = d3.axisBottom(x1)
        .ticks(barData.length);

    g1.append("g")
        .attr("transform", `translate(0, ${barHeight})`)
        .call(xAxisCall1)
        .selectAll("text")
            .attr("y", "10")
            .attr("x", "-5")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-40)")
            .attr("font-size", "11px")
            .attr("font-family", "sans-serif");

    // Y axis
    const y1 = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.respondents)])
        .range([barHeight, 80])
        .nice();

    const yAxisCall1 = d3.axisLeft(y1)
        .ticks(6);
    g1.append("g").call(yAxisCall1);

    // bars
    const bars = g1.selectAll("rect").data(barData);

    bars.enter().append("rect")
        .attr("y", d => y1(d.respondents))
        .attr("x", d => x1(d.genre) + 5)
        .attr("width", x1.bandwidth() - 10)
        .attr("height", d => barHeight - y1(d.respondents))
        .attr("fill", d => color(d.genre));

    // bar labels
    bars.enter().append("text")
        .text(d => d.respondents)
        .attr("y", d => y1(d.respondents) - 5)
        .attr("x", d => x1(d.genre) + x1.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px");

    // *******************************************
    // Plot 2: Detail Stream Graph
    // *******************************************
    // I referenced the following to make this stream graph: https://d3-graph-gallery.com/graph/streamgraph_basic.html
    const svg_detail1 = d3.select("#detail1")
        .attr("viewBox", `0 0 ${streamWidth + streamMargin.left + streamMargin.right} ${streamHeight + streamMargin.top + streamMargin.bottom}`);

    const g2 = svg_detail1.append("g")
        .attr("width", streamWidth + streamMargin.left + streamMargin.right)
        .attr("height", streamHeight + streamMargin.top + streamMargin.bottom)
        .attr("transform", `translate(${streamMargin.left}, ${streamMargin.top})`);

    // Title
    g2.append("text")
        .attr("x", streamWidth / 2 - 65)
        .attr("y", streamMargin.top + 50)
        .attr("font-size", "23px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Favorite Music Genres by Age");

    // Legend
    const legend2 = svg_detail1.append("g")
        .attr("transform", `translate(${streamWidth + 95}, ${streamMargin.top + 90})`);

    // Create the dots in the legend
    const size = 20
    legend2.selectAll("legend")
        .data(genresArray)
        .join("circle")
        .attr("cx", (d, i) => i < genresArray.length / 2 ? streamMargin.right - 210 : streamMargin.right - 100)
        .attr("cy", (d, i) => i % (genresArray.length / 2) * (size + 6))
        .attr("r", 8)
        .style("fill", d => color(d))

    // Create the labels in the legend
    legend2.selectAll("legend")
        .data(genresArray)
        .enter()
        .append("text")
        .attr("x", (d, i) => i < genresArray.length / 2 ? streamMargin.right - 195 : streamMargin.right - 85)
        .attr("y", (d, i) => 5 + i % (genresArray.length / 2) * (size + 6))
        .text(d => d)
        .attr("text-anchor", "left")
        .style("font-size", "9px")
        .attr("font-family", "sans-serif")

    // X axis label
    g2.append("text")
        .attr("x", streamWidth / 2 - 170)
        .attr("y", streamHeight + 65)
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Age in Years");


    // Y axis label
    g2.append("text")
        .attr("x", streamMargin.left + 235)
        .attr("y", streamMargin.top + 60)
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Percentage of Respondents");

    // X axis
    const x2 = d3.scaleBand()
        .domain(streamData.map(d => d.age))
        .range([0, streamWidth - 300]);

    const xAxisCall2 = d3.axisBottom(x2)
        .ticks(streamData.length);
    g2.append("g")
        .attr("transform", `translate(0, ${streamHeight})`)
        .call(xAxisCall2)
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y axis
    const y2 = d3.scaleLinear()
        .domain([0, 100])
        .range([streamHeight, 80])
        .nice();

    const yAxisCall2 = d3.axisLeft(y2)
        .ticks(6);
    g2.append("g").call(yAxisCall2);

    // Stack the data for each genre of the stream graph
    // I referenced the following while completing this step: https://d3js.org/d3-shape/stack
    var stackedData = d3.stack()
        .keys(genresArray)
        .value(([age, group], key) => {
            console.log(age);
            return group.get(key) ? group.get(key).respondents : 0;
        })
        (d3.index(streamData, d => d.age, d => d.genre));

    // Areas
    const areas = g2.selectAll("layers").data(stackedData);

    areas.enter().append("path")
        .style("fill", function(d) { return color(d.key); })
        .attr("d", d3.area()
            .x(function(d, i) { return x2(d.data[0]) + 40;})
            .y0(function(d) { return y2(d[0]); })
            .y1(function(d) { return y2(d[1]); })
        )

    // *******************************************
    // Plot 3: Detail Pie Charts
    // *******************************************
    // I referenced the following code to construct these charts: https://d3-graph-gallery.com/graph/pie_basic.html
    const svg_detail2 = d3.select("#detail2")
        .attr("viewBox", `0 0 ${pieWidth + pieMargin.left + pieMargin.right} ${pieHeight + pieMargin.top + pieMargin.bottom}`);

    // Title
    svg_detail2.append("text")
        .attr("x", pieWidth / 2)
        .attr("y", pieMargin.top + 25)
        .attr("font-size", "18px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Favorite Music Genres of");

    svg_detail2.append("text")
        .attr("x", pieWidth / 2)
        .attr("y", pieMargin.top + 50)
        .attr("font-size", "18px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Composers vs. Non-Composers");

    // Legend
    const legend3 = svg_detail2.append("g")
        .attr("transform", `translate(${pieMargin.right + 160}, ${pieMargin.top + 155})`);

    // Create the dots in the legend
    legend3.selectAll("legend")
        .data(genresArray)
        .join("circle")
        .attr("cx", 0)
        .attr("cy", (d, i) => i * (size - 1))
        .attr("r", 6)
        .style("fill", d => color(d))

    // Create the labels in the legend
    legend3.selectAll("legend")
        .data(genresArray)
        .enter()
        .append("text")
        .attr("x", 12)
        .attr("y", (d, i) => 5 + i * (size - 1) - 2)
        .text(d => d)
        .attr("text-anchor", "left")
        .style("font-size", "7px")
        .attr("font-family", "sans-serif")

    // Composer Pie chart
    const g3 = svg_detail2.append("g")
        .attr("width", pieWidth + pieMargin.left + pieMargin.right)
        .attr("height", pieHeight + pieMargin.top + pieMargin.bottom)
        .attr("transform", `translate(${pieMargin.left + 30}, ${pieMargin.top + 195})`);

    // Label
    g3.append("text")
        .attr("x", 0)
        .attr("y", -105)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Composers");

    // radius for pie chart
    var radius = 80;

    // Compute the angles for the pie chart
    var pie = d3.pie().sort(null)
        .value(d => d.respondents)
    var pie1DataReady = pie(pie1Data)

    // Arcs
    const pie1Chart = g3.selectAll("pie").data(pie1DataReady);

    pie1Chart.enter().append("path")
        .attr('d', d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius)
        )
        .attr('fill', d => color(d.data.genre))

    // Labels
    // I referenced the following code while constructing these labels: https://d3-graph-gallery.com/graph/donut_label.html
    var labelPos = d3.arc()
        .innerRadius(radius)
        .outerRadius(radius * 1.2)

    const pie1Labels = g3.selectAll("labels").data(pie1DataReady);

    pie1Labels.enter().append("text")
        .text(d => d3.format(".0f")(Math.round((d.data.respondents) / d3.sum(pie1Data, d => d.respondents) * 100)) + "%")
        .attr("transform", function(d) { return "translate(" + labelPos.centroid(d) + ")";  })
        .style("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("font-size", "7px")
        .style("dominant-baseline", "middle")
        .style("text-anchor", "middle")

    // Non Composer Pie Chart
    const g4 = svg_detail2.append("g")
        .attr("width", pieWidth + pieMargin.left + pieMargin.right)
        .attr("height", pieHeight + pieMargin.top + pieMargin.bottom)
        .attr("transform", `translate(${pieMargin.left + 30}, ${pieMargin.top + 425})`);

    // Label
    g4.append("text")
        .attr("x", 0)
        .attr("y", -105)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Non-Composers");

    // Compute the angles for the pie chart
    var pie2DataReady = pie(pie2Data)

    // Arcs
    const pie2Chart = g4.selectAll("pie").data(pie2DataReady);

    pie2Chart.enter().append("path")
        .attr('d', d3.arc()
            .innerRadius(radius * 0.5) // make it a donut chart
            .outerRadius(radius)
        )
        .attr('fill', d => color(d.data.genre))

    // Labels
    const pie2Labels = g4.selectAll("labels").data(pie2DataReady);

    pie2Labels.enter().append("text")
        .text(d => d3.format(".0f")(Math.round((d.data.respondents) / d3.sum(pie2Data, d => d.respondents) * 100)) + "%")
        .attr("transform", function(d) { return "translate(" + labelPos.centroid(d) + ")";  })
        .attr("font-family", "sans-serif")
        .attr("font-size", "7px")
        .style("dominant-baseline", "middle")
        .style("text-anchor", "middle")

}).catch(function(error){
    console.log(error);
});