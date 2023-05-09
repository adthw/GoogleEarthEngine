var era5 = ee.ImageCollection("ECMWF/ERA5/MONTHLY");
var gaul = ee.FeatureCollection("FAO/GAUL/2015/level2");

////////////////////////////  
// Temporalité
////////////////////////////
var endDate = ee.Date("2019-08-01");
//var interval = '-3' (voir comment utiliser une variable)
var pas = 'month'
var startDate = endDate.advance(-3, pas);
var era5_dates = era5.filter(ee.Filter.date(startDate, endDate));
  
////////////////////////////  
// Géographie
////////////////////////////
var region = "Provence-Alpes-Cote-d'Azur"

var geo_fr = gaul.filter(ee.Filter.eq('ADM0_NAME', 'France'));
var geo_select = geo_fr.filter(ee.Filter.eq('ADM1_NAME', region));
var depts = geo_select.aggregate_array('ADM2_NAME').distinct();


// Pour afficher/choisir les regions
var geo_fr_total = geo_fr.aggregate_array('ADM1_NAME').distinct();
print(geo_fr_total);

//centrage de la carte
Map.centerObject(geo_select, 7);

////////////////////////////  
// Visualisations
////////////////////////////

var pal_precip = ['white', 'lightblue', 'blue'];
var pal_temp = ['white', 'yellow', 'red'];

var visualization_precip = {
bands: ['total_precipitation'],
min: 0,
max: 0.32,
palette: pal_precip
};

var visualization_temp = {
bands: ['mean_2m_air_temperature'],
min: 270,
max: 300,
palette: pal_temp
};

var visualization_precip_moy = {
min: 0,
max: 0.32,
palette: pal_precip
};

var visualization_temp_moy = {
min: 270,
max: 300,
palette: pal_temp
};


////////////////////////////////////////////////////////  
// Calculs et affichages
////////////////////////////////////////////////////////

depts.evaluate(function(depts) {
  depts.forEach(function(dept) {
    var dept_fc = gaul.filter(ee.Filter.eq('ADM2_NAME', dept));
    var data_era5 = era5_dates.mean().clip(dept_fc);

    Map.addLayer(data_era5, visualization_temp, "temperatures_" + dept);
    Map.addLayer(data_era5, visualization_precip, "precipitations_" + dept);
    
  });
});

//Calcul des moyennes géographiques
depts.evaluate(function(depts) {
  depts.forEach(function(dept) {
    var dept_fc = gaul.filter(ee.Filter.eq('ADM2_NAME', dept));
    var data_era5 = era5_dates.mean().clip(dept_fc);
    
    var temp = data_era5.select('mean_2m_air_temperature');
    var precip = data_era5.select('total_precipitation');
    
    var mean_temp = temp.reduceRegion({
      geometry: dept_fc,
      reducer: ee.Reducer.mean(),
      scale: 10000
    });
    
    print(mean_temp);
    
    var mean_precip = precip.reduceRegion({
      geometry: dept_fc,
      reducer: ee.Reducer.mean(),
      scale: 10000
    });
    
  print(mean_precip);
  
  
  //mean_precip.getInfo(function(info){
  //console.log(info);
  //});
    console.log(mean_precip.getInfo().type);
    
    //var propertyNames = mean_precip.propertyNames();
    //console.log(propertyNames);

    
    // firstFeature = mean_precip.first();
    // meanValue = firstFeature.get('mean');
    //console.log('Mean value:', meanValue);

    
    //for (var i = 0; i < mean_precip.features.length; i++) {
    //var feature = mean_precip.features[i];
    //console.log(feature);
    //}
    
    //print(mean_precip.properties.mean);
    
    //print('moyenne : '+ mean_precip.get('mean') + ' - dept : '+ ADM0_CODE + ' - ' + ADM2_NAME);
//Map.addLayer(mean_precip, visualization_precip_moy, "mean_precipitations_" + dept);
    
  });
});


////////////////////////////  
// légende
////////////////////////////
function ColorBar(palette) {
  return ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '100x10',
      format: 'png',
      min: 0,
      max: 0.7,
      palette: palette,
    },
    style: {stretch: 'horizontal', margin: '0px 4px'},
  });
}


//////////////////////    
//legende precip

function makeLegend(palette) {
  var labelPanel = ui.Panel(
      [],
      ui.Panel.Layout.flow('horizontal'));
  return ui.Panel([ColorBar(pal_precip), labelPanel]);
}
// Assemble the legend panel.
Map.add(ui.Panel(
    [
      ui.Label('Précipitations'), makeLegend(),
    ],
    ui.Panel.Layout.flow('vertical'),
    {width: '120px', position: 'bottom-left'}));
    
//////////////////////    
//legende temperatures

function makeLegend2(palette) {
  var labelPanel2 = ui.Panel(
      [],
      ui.Panel.Layout.flow('horizontal'));
  return ui.Panel([ColorBar(pal_temp), labelPanel2]);
}
// Assemble the legend panel.
Map.add(ui.Panel(
    [
      ui.Label('Températures'), makeLegend2(),
    ],
    ui.Panel.Layout.flow('vertical'),
    {width: '120px', position: 'bottom-left'}));

