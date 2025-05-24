// The overall layout of the dashboard was inspired by https://shorturl.at/Ha4WY

// *******************************************************************************
//                                GLOBAL ASSETS
// *******************************************************************************

// Measurements
const width = window.innerWidth;
const height = window.innerHeight;

let scatterMargin = {top: -20, right: 30, bottom: 60, left: 20},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

let barMargin = {top: 10, right: -30, bottom: 100, left: -15},
    barWidth = 400 - barMargin.left - barMargin.right,
    barHeight = 350 - barMargin.top - barMargin.bottom;

let starMargin = {top: 0, right: 0, bottom: 0, left: 0},
    starWidth = 400 - starMargin.left - starMargin.right,
    starHeight = 550 - starMargin.top - starMargin.bottom;

// Colors
// Several colors in this palette were sourced from: https://shorturl.at/Ha4WY
const colors = [
    "#B3CAF7",
    "#B96EFC",
    "#5770EF",
    "#5EE1AB",
    "#D8C7FB",
    "#64ADFC"
];
const starPlotColor = "#DE8EF1";
const defaultColor = "#333333";

// Constants
const globalSkinTypes = [
    "Combination",
    "Dry",
    "Normal",
    "Oily",
    "Sensitive"
];

// *******************************************************************************
//                               DATA PROCESSING
// *******************************************************************************

// This dataset was sourced from: https://www.kaggle.com/datasets/kingabzpro/cosmetics-datasets
d3.csv("data/cosmetics.csv").then(data =>{

    let globalScatterData = [];
    let scatterData = [];
    let barData = [];
    let starData = [];

    // Process scatter plot data
    data.forEach(d =>
    {
        let d_skinTypes = [];
        globalSkinTypes.forEach(c => {
            d_skinTypes.push( {skinType: c, value: Number(d[c])} );
        })
        const dataPoint = {
            productType: d["Label"],
            price: Number(d["Price"]),
            rating: Number(d["Rank"]),
            skinTypes: d_skinTypes
        }
        globalScatterData.push(dataPoint);
    });
    scatterData = globalScatterData;

    // Put the product types into an array
    let globalProductTypes = [];
    scatterData.forEach(d => {
        if(globalProductTypes.indexOf(d.productType) === -1){
            globalProductTypes.push(d.productType);
        }
    })

    // Assign a color for each product type
    const color = d3.scaleOrdinal()
        .domain(globalProductTypes)
        .range(colors);

    // A function to process bar chart data given a selection of points from
    // the scatter plot
    function barFromScatter(scatterData){
        let barData = [];
        const productTypes = {};
        // Create a data point for each product type
        globalProductTypes.forEach(c => {
            productTypes[c] = {productType: c, products: 0};
        })

        // Count the number of products of each product type
        scatterData.forEach(d =>
        {
            productTypes[d.productType].products = productTypes[d.productType].products + 1;
        });

        // Push the data points into the bar chart data array
        Object.keys(productTypes).forEach(d => {
            barData.push(productTypes[d]);
        });

        // Convert the amounts to percentages of the total number of products
        barData.forEach(d =>
        {
            d.products = scatterData.length ?
                d.products / scatterData.length * 100 : 0;
        });

        return barData;
    }
    barData = barFromScatter(scatterData);

    // A function to process star chart data given a selection of points from
    // the scatter plot
    function starFromScatter(scatterData){
        let starData = [];
        const skinTypes = {};
        globalSkinTypes.forEach(c => {
            skinTypes[c] = {skinType: c, products: 0};
        })

        // Count the number of products that cover each skin type
        scatterData.forEach(d =>
        {
            globalSkinTypes.forEach(c => {
                skinTypes[c].products =
                    skinTypes[c].products + d.skinTypes.find( b => b.skinType == c ).value;
            })
        });

        // Push the data points into the star plot data array
        Object.keys(skinTypes).forEach(d => {
            starData.push(skinTypes[d]);
        });

        // Convert the amounts to percentages of the total number of products
        starData.forEach(d =>
        {
            d.products = scatterData.length ?
                d.products / scatterData.length * 100 : 0;
        });

        return starData;
    }
    starData = starFromScatter(scatterData);

    // *******************************************************************************
    //                                   PLOTS
    // *******************************************************************************
    // I referenced the following tutorial throughout my implementation to learn about join, enter, update, and exit
    // https://objectcomputing.com/resources/publications/sett/august-2020-mastering-d3-basics

    // *******************************************
    // Plot 1: Context Scatter Plot
    // *******************************************
    // I referenced the following to create this plot:
    // https://observablehq.com/@d3/zoomable-scatterplot?collection=@d3/d3-zoom
    const svg_context = d3.select("#context")
        .attr("viewBox", `0 0 ${scatterWidth + scatterMargin.left + scatterMargin.right} ${scatterHeight + scatterMargin.top + scatterMargin.bottom}`);
    const context = svg_context.append("g")
        .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // Title
    context.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterMargin.top + 80)
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Product Price vs. Rating");

    // X axis label
    context.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Price in USD");

    // Y axis label
    context.append("text")
        .attr("x", scatterMargin.left - 40)
        .attr("y", scatterMargin.top + 80)
        .attr("font-size", "10px")
        .attr("text-anchor", "right")
        .text("Rating")
        .attr("font-family", "sans-serif");

    // Plot
    const plot = context.append("g");

    // X axis
    const x1 = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.price)])
        .range([0, scatterWidth]);
    const xAxis1 = (g, x) => {
        return g
            .attr("transform", `translate(0, ${scatterHeight})`)
            .call(d3.axisBottom(x).ticks(7))
            .call(g => g.select(".domain"));
    }
    const gx = plot.append("g").call(xAxis1, x1);

    // Y axis
    const y1 = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.rating)])
        .range([scatterHeight, 80]);
    const yAxis1 = (g, y) => {
        return g
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.select(".domain"));
    }
    const gy = plot.append("g").call(yAxis1, y1);

    // Plot clipping path
    // I referenced the following example to implement this:
    //https://observablehq.com/@eesur/svg-clippath-using-d3
    const radius = 2;
    const defs = plot.append("defs");
    defs.append("clipPath")
        .attr("id", "dotClipPath")
        .append("rect")
        .attr("x", 0 - radius)
        .attr("y", 80 - radius)
        .attr("width", scatterWidth + 2 * radius)
        .attr("height", scatterHeight - 80 + 2 * radius);

    // Dots
    const dots = plot.append("g")
                     .attr("clip-path", "url(#dotClipPath)");
    dots.selectAll("circle").data(scatterData)
        .enter().append("circle")
            .attr("cx", (d) => x1(d.price))
            .attr("cy", (d) => y1(d.rating))
            .attr("r", radius)
            .style("fill", defaultColor)
            .style("opacity", 0.75);

    // Grid lines
    const grid = (g, x, y) => g
        .attr("stroke", defaultColor)
        .attr("stroke-opacity", 0.15)
        .call(g => g
            .selectAll(".x")
            .data(x.ticks(7))
            .join(
                enter => enter.append("line").attr("class", "x").attr("y2", scatterHeight),
                update => update,
                exit => exit.remove()
            )
            .attr("x1", d => 0.5 + x(d))
            .attr("x2", d => 0.5 + x(d)))
        .call(g => g
            .selectAll(".y")
            .data(y.ticks(5))
            .join(
                enter => enter.append("line").attr("class", "y").attr("x2", scatterWidth),
                update => update,
                exit => exit.remove()
            )
            .attr("y1", d => 0.5 + y(d))
            .attr("y2", d => 0.5 + y(d)));
    const gGrid = plot.append("g")
                      .attr("clip-path", "url(#dotClipPath)")
                      .call(grid, x1, y1);

    // Zoom functionality
    // I referenced the following tutorials and examples while implementing this functionality:
    // https://observablehq.com/@d3/zoomable-scatterplot?collection=@d3/d3-zoom
    // https://observablehq.com/@d3/zoomable-bar-chart?collection=@d3/d3-zoom
    const zoomExtent = [[0, 80], [scatterWidth, scatterHeight]];
    const zoom = d3.zoom()
        .scaleExtent([1, 15])
        .translateExtent(zoomExtent)
        .extent(zoomExtent)
        .on("zoom", zoomed);

    let zx = x1;
    let zy = y1;
    // Update positions based on zoom/pan transform
    function zoomed({transform}) {
        zx = transform.rescaleX(x1).interpolate(d3.interpolateRound);
        zy = transform.rescaleY(y1).interpolate(d3.interpolateRound);
        // Update dots
        dots.selectAll("circle").data(scatterData).join(
            enter => enter,
            update => update
                .attr("cx", (d) => zx(d.price))
                .attr("cy", (d) => zy(d.rating)),
            exit => exit.remove()
            );
        // Update axes
        gx.call(xAxis1, zx);
        gy.call(yAxis1, zy);
        // Update grid lines
        gGrid.call(grid, zx, zy);
    }
    svg_context.call(zoom).call(zoom.transform, d3.zoomIdentity);

    // Brush functionality
    // I referenced the example while implementing this functionality:
    // https://observablehq.com/@d3/brushable-scatterplot-matrix?collection=@d3/d3-brush
    const brushExtent = [[0 - radius, 80 - radius], [scatterWidth + radius, scatterHeight + radius]];
    const brush = d3.brush()
        .extent(brushExtent)
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);
    let brushPlot;

    // Remove current brush if already there
    function brushstarted() {
        if (brushPlot !== this) {
            d3.select(brushPlot).call(brush.move, null);
            brushPlot = this;
        }
    }

    // Select circles within bounding box
    function brushed({selection})
    {
        let selected = [];
        if (selection) {
            const [[x0_sel, y0_sel], [x1_sel, y1_sel]] = selection;
            // Deselected circles will have reduced opacity
             dots.selectAll("circle").classed("deselected",
                 d => !(x0_sel < zx(d.price)
                     && x1_sel > zx(d.price)
                     && y0_sel < zy(d.rating)
                     && y1_sel > zy(d.rating)));
            selected = scatterData.filter(
                d => x0_sel < zx(d.price)
                    && x1_sel > zx(d.price)
                    && y0_sel < zy(d.rating)
                    && y1_sel > zy(d.rating));
        }

        // Update bar chart and scatter plot data
        if (selection) {
            barData = barFromScatter(selected);
            starData = starFromScatter(selected);
        } else {
            barData = barFromScatter(scatterData);
            starData = starFromScatter(scatterData);
        }
        // Redraw bar chart and star plot
        renderBarGraph();
        renderStarGraph();
    }

    // If the bounding box is empty, select all the circles
    function brushended({selection}) {
        if (selection) {
            barData = barFromScatter(selected);
            starData = starFromScatter(selected);
        } else {
            barData = barFromScatter(scatterData);
            starData = starFromScatter(scatterData);
            dots.selectAll("circle").classed("deselected", false);
        }
        // Redraw bar chart and star plot
        renderBarGraph();
        renderStarGraph();
    }

    // I referenced the following while implementing these buttons:
    // https://objectcomputing.com/resources/publications/sett/august-2020-mastering-d3-basics

    // Navigation button
    const navButton = d3.select("#navButton");
    // is pressed by default
    navButton.classed("pressed", true);
    navButton.on("click", function()
    {
        // Activate zoom functionality and deactivate brush functionality
        navButton.classed("pressed", true);
        brushButton.classed("pressed", false);
        plot.on('.brush', null);
        svg_context.selectAll(".selection").remove();
        dots.selectAll("circle").classed("deselected", false);
        svg_context.call(zoom);
    })

    // Brush button
    const brushButton = d3.select("#brushButton");
    brushButton.on("click", function()
    {
        // Activate brush functionality and deactivate zoom functionality
        brushButton.classed("pressed", true);
        navButton.classed("pressed", false);
        svg_context.on('.zoom', null);
        plot.call(brush);
        plot.call(brush.move, null);
    })

    // *******************************************
    // Plot 2: Focus1 Bar Chart
    // *******************************************
    const svg_focus1 = d3.select("#focus1")
        .attr("viewBox", `0 0 ${barWidth + barMargin.left + barMargin.right} ${barHeight + barMargin.top + barMargin.bottom}`);
    const focus1 = svg_focus1.append("g")
        .attr("transform", `translate(${barMargin.left}, ${barMargin.top})`);

    // Title
    focus1.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barMargin.top + 18)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Product Type Composition");

    // X axis label
    focus1.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barHeight + 80)
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Product Type");


    // Y axis label
    focus1.append("text")
        .attr("x", barMargin.left -35)
        .attr("y", barMargin.top + 55)
        .attr("font-size", "15px")
        .attr("text-anchor", "right")
        .text("Percentage of Products")
        .attr("font-family", "sans-serif");

    // X axis
    const x2 = d3.scaleBand()
        .domain(barData.map(d => d.productType))
        .range([0, barWidth]);
    const xAxis2 = d3.axisBottom(x2);
    let gx2 = focus1.append("g")
        .attr("transform", `translate(0, ${barHeight})`)
        .call(xAxis2);
    gx2.selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)")
        .attr("font-size", "11px")
        .attr("font-family", "sans-serif");

    // Y axis
    const y2 = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.products) + 3])
        .range([barHeight, 80]);
    const yAxis2 = d3.axisLeft(y2)
        .ticks(6);
    let gy2 = focus1.append("g").call(yAxis2);

    // Bars
    let bars = focus1.append("g");

    renderBarGraph();
    function renderBarGraph () {
        // Update y axis
        y2.domain([0, d3.max(barData, d => d.products) + 3]);
        gy2.call(yAxis2);

        // Rectangles
        bars.selectAll("rect").data(barData).join(
            enter => enter.append("rect")
                .attr("y", d => y2(d.products))
                .attr("x", d => x2(d.productType) + x2.bandwidth()/5)
                .attr("width", x2.bandwidth() - 30)
                .attr("height", d => barHeight - y2(d.products))
                .attr("fill", d => color(d.productType)),
            update => update
                .attr("height", d => barHeight - y2(d.products))
                .attr("y", d => y2(d.products))
                .attr("x", d => x2(d.productType) + x2.bandwidth()/5)
                .attr("fill", d => color(d.productType)),
            exit => exit.remove()
        )

        // Bar Labels
        bars.selectAll("text").data(barData).join(
            enter => enter.append("text")
                .text(d => d3.format(".0f")(Math.round(d.products)) + "%")
                .attr("y", d => y2(d.products) - 5)
                .attr("x", d => x2(d.productType) + x2.bandwidth() / 2)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px"),
            update => update
                .text(d => d3.format(".0f")(Math.round(d.products)) + "%")
                .attr("y", d => y2(d.products) - 5)
                .attr("x", d => x2(d.productType) + x2.bandwidth() / 2),
            exit => exit.remove()
        )
    }

    // I referenced the third coding workshop in this class to create this sorting animation
    // Sort button
    const sortButton = d3.select("#sortButton");
    sortButton.on("click", function()
    {
        // Order function
        let order = function(x, y){
            return d3.ascending(x.products, y.products);
        };

        // Sort data
        x2.domain(barData.sort(order).map(d => d.productType));

        // Rectangle transition
        bars.selectAll("rect")
            .data(barData, d => d.productType)
            .order()
            .transition()
            .delay((d, i) => i * 50)
            .duration(750).attr("x", d => x2(d.productType) + x2.bandwidth()/5);
        // Text transition
        bars.selectAll("text")
            .data(barData, d => d.productType)
            .order()
            .transition()
            .delay((d, i) => i * 50)
            .duration(750).attr("x", d => x2(d.productType) + x2.bandwidth()/2);
        // Tick transition
        const new_xAxis2 = d3.axisBottom(x2)
            .ticks(barData.length);
        gx2.transition().delay(50).duration(750).call(xAxis2);
    })

    // *******************************************
    // Plot 3: Focus2 Star Plot
    // *******************************************
    // I referenced the following code to construct this plot: https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart
    const svg_focus2 = d3.select("#focus2")
        .attr("viewBox", `0 0 ${starWidth + starMargin.left + starMargin.right} ${starHeight + starMargin.top + starMargin.bottom}`);
    const focus2 = svg_focus2.append("g")
        .attr("transform", `translate(${starMargin.left}, ${starMargin.top})`);

    // Title
    focus2.append("text")
        .attr("x", starWidth / 2)
        .attr("y", starMargin.top + 60)
        .attr("font-size", "30px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("Average Skin Type Coverage");

    // Circle grid
    let radialScale = d3.scaleLinear()
        .domain([0,100])
        .range([0, 170]);
    let ticks = [25, 50, 75, 100];

    const starGrid = focus2.selectAll("circle").data(ticks);
    starGrid.join(
            enter => enter.append("circle")
                .attr("cx", starWidth / 2)
                .attr("cy", starHeight / 2 + 60)
                .attr("fill", "none")
                .attr("stroke", defaultColor)
                .attr("stroke-width", 2)
                .attr("opacity", 0.3)
                .attr("r", d => radialScale(d))
        );

    // Grid tick labels
    const starGridLabels = focus2.selectAll("ticklabel").data(ticks);
    starGridLabels.join(
        enter => enter.append("text")
            .attr("class", "ticklabel")
            .attr("x", starWidth / 2 + 5)
            .attr("y", d => starHeight / 2 - radialScale(d) + 77)
            .attr("font-size", "13px")
            .attr("text-anchor", "left")
            .attr("font-family", "sans-serif")
            .attr("fill", defaultColor)
            .attr("opacity", 0.8)
            .text(d => d.toString())
    );

    // Grid main label
    focus2.append("text")
        .attr("x", starWidth / 2 + 5)
        .attr("y", starMargin.top + 155)
        .attr("font-size", "13px")
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .attr("fill", defaultColor)
        .attr("opacity", 0.8)
        .text("Percentage of Products");

    // Axes
    function angleToCoordinate(angle, value){
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return {"x": starWidth / 2 + x, "y": starHeight / 2 + 60 - y};
    }
    let starAxisData = globalSkinTypes.map((f, i) => {
        let angle = (Math.PI / 2) + (2 * Math.PI * i / globalSkinTypes.length);
        return {
            "name": f,
            "angle": angle,
            "line_coord": angleToCoordinate(angle, 125),
            "label_coord": angleToCoordinate(angle, 135)
        };
    });

    // Axis lines
    const starAxisLines = focus2.selectAll("line").data(starAxisData);
    starAxisLines.join(
            enter => enter.append("line")
                .attr("x1", starWidth / 2)
                .attr("y1", starHeight / 2 + 60)
                .attr("x2", d => d.line_coord.x)
                .attr("y2", d => d.line_coord.y)
                .attr("stroke", defaultColor)
                .attr("stroke-width", 2)
                .attr("opacity", 0.3)
        );

    // Axis labels
    const starAxisLabels = focus2.selectAll(".axislabel").data(starAxisData);
    starAxisLabels.join(
            enter => enter.append("text")
                .attr("x", d => d.label_coord.x)
                .attr("y", d => d.label_coord.y)
                .text(d => d.name)
                .attr("font-size", "17px")
                .attr("font-family", "sans-serif")
                .style("dominant-baseline", "middle")
                .style("text-anchor", "middle")
        );

    // Paths
    let line = d3.line()
        .x(d => d.x)
        .y(d => d.y);

    renderStarGraph();
    function renderStarGraph () {

        // Compute path coordinates for each skin type
        let starPathCoordinates = [];
        starData.forEach(d =>
        {
            let i = globalSkinTypes.findIndex(c => c == d.skinType);
            let angle = (Math.PI / 2) + (2 * Math.PI * i / globalSkinTypes.length);
            starPathCoordinates.push(angleToCoordinate(angle, d.products));
        });
        starPathCoordinates.push(starPathCoordinates[0]);

        // Draw paths
        const starPaths = focus2.selectAll("path").data(starPathCoordinates);
        starPaths.join(
            enter => enter.append("path")
                .datum(starPathCoordinates)
                .attr("d", line)
                .attr("stroke", defaultColor)
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 0.3)
                .attr("fill", starPlotColor)
                .attr("opacity", 0.1),
            update => update.datum(starPathCoordinates)
                .attr("d", line)
        );
    }

}).catch(function(error){
    console.log(error);
});