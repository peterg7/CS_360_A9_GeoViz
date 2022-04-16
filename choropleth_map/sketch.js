// NOTE: Referenced https://bl.ocks.org/wboykinm/dbbe50d1023f90d4e241712395c27fb3

/**********************
 ***    Constants   ***
 **********************/

// set the dimensions and margins of the graph
const SCREEN_DIMENSIONS = { 
    width: 800,
    height: 500,
    leftMargin: 25,
    rightMargin: 100,
    topMargin: 20,
    bottomMargin: 25,
    cellPadding: 20
};
SCREEN_DIMENSIONS.innerWidth = SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.leftMargin - SCREEN_DIMENSIONS.rightMargin;
SCREEN_DIMENSIONS.innerHeight = SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.topMargin - SCREEN_DIMENSIONS.bottomMargin;

const TITLE_TEXT = "2020 US Populuation Estimates";
const CSV_PATH = '../data/state_population_data.csv';
const JSON_PATH = '../data/us-states.json';

const columnTranslations = new Map([
    ['State', 'state'],
    ['Population 2020', 'value']
]);

const colorRange = ['#ededed', '#59c6d9'];
const legendParams = {
  cell_height: 30,
  num_cells: 5,
}
legendParams['height'] = legendParams.cell_height * legendParams.num_cells;

/**********************
 * Feature parameters *
 **********************/
// D3 Projection
var projection = d3.geoAlbersUsa()
  .translate([SCREEN_DIMENSIONS.innerWidth / 2, SCREEN_DIMENSIONS.innerHeight / 2])
  .scale([1000]);

// D3 geo-path generator
var path = d3.geoPath()
  .projection(projection);
 
// Append the svg object to the body of the page
var svg = d3.select('body').append('svg')
    .attr('width', SCREEN_DIMENSIONS.width)
    .attr('height', SCREEN_DIMENSIONS.height)
    .attr("viewBox", [-SCREEN_DIMENSIONS.leftMargin, -SCREEN_DIMENSIONS.topMargin, 
                        SCREEN_DIMENSIONS.width, SCREEN_DIMENSIONS.height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

/******************
 * Graphic groups *
 ******************/
const canvas = svg.append('g')
 .attr('transform', `translate(${SCREEN_DIMENSIONS.leftMargin},${SCREEN_DIMENSIONS.topMargin})`);

const titleGroup = canvas.append("text")
 .attr('transform', `translate(${(SCREEN_DIMENSIONS.innerWidth / 2)},${0 - (SCREEN_DIMENSIONS.topMargin * 1.35)})`)
 .attr("class", "title")
 .text(TITLE_TEXT);

const legendGroup = canvas.append('g')
 .attr("transform", `translate(${SCREEN_DIMENSIONS.innerWidth + 35},${SCREEN_DIMENSIONS.innerHeight - SCREEN_DIMENSIONS.bottomMargin - legendParams.height})`)
 .attr("class", "legendLinear");

/*********************
 * Data manipulation *
 *********************/

const preprocess = (row, i) => {
  return Object.fromEntries(
      Array.from(columnTranslations.entries())
          .map(([key, val]) => {
              if (key == 'State')
                  return [val, row[key]]
              return [val, parseInt(row[key])]
          })
  );
};

 // Load population data
 d3.csv(CSV_PATH, preprocess).then((data, i) => {

  var minVal = d3.min(data, d => d.value);
  var maxVal = d3.max(data, d => d.value);
  var colorScale = d3.scaleLinear()
                      .domain([minVal, maxVal])
                      .range(colorRange);
     
   // Load GeoJSON
   d3.json(JSON_PATH).then((json) => {

     // Transfer population data to JSON data
     for (var i = 0; i < data.length; i++) {
       var csvState = data[i].state,
            csvValue = data[i].value;

       for (var j = 0; j < json.features.length; j++) {
         var jsonState = json.features[j].properties.name;
 
         if (csvState == jsonState) {
           json.features[j].properties.value = csvValue;
           break;
         }
       }
     }
 
     // Create paths
     canvas.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .style("fill", d => colorScale(d.properties.value));
   });

   // Define and build legend
    var legend = d3.legendColor()
                    .shapeHeight(legendParams.cell_height)
                    .cells(legendParams.num_cells)
                    .orient("vertical")
                    .ascending(true)
                    .scale(colorScale)
                    .labelFormat(d3.format(".1s"));

    legendGroup.call(legend);
 });