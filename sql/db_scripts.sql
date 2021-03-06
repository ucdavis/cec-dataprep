-- populate clusters
insert into clusters (id)
select distinct cluster_no from pixels
where not exists(select * from clusters where id = cluster_no);

-- find most common value in cluster (useful for forest type, sit_raster)
select distinct on (cluster_no) cluster_no as id, most_freq_value as forest_type
  from (select cluster_no, forest_type as most_freq_value, count(*) as _count from pixels group by cluster_no, forest_type) a
where cluster_no in (
select distinct cluster_no from pixels
)
order by cluster_no, _count desc

-- aggregrate pixel level data 
select
  cluster_no  ,
  count(*) as no_pixels,
  county      ,
  sit_raster ,
  land_use,
  forest_type,
  avg(x)          as avg_x ,
  avg(y)          as avg_y,
  avg(elevation) as avg_elevation,
  sum(ba_0     )   as ba_0     ,
  sum(ba_15    )   as ba_15    ,
  sum(ba_2     )   as ba_2     ,
  sum(ba_25    )   as ba_25    ,
  sum(ba_35    )   as ba_35    ,
  sum(ba_40    )   as ba_40    ,
  sum(ba_7     )   as ba_7     ,
  sum(basa_as  )   as basa_as  ,
  sum(basa_ra  )   as basa_ra  ,
  sum(basa_wi  )   as basa_wi  ,
  sum(bmcwn_0  )   as bmcwn_0  ,
  sum(bmcwn_15 )   as bmcwn_15 ,
  sum(bmcwn_2  )   as bmcwn_2  ,
  sum(bmcwn_25 )   as bmcwn_25 ,
  sum(bmcwn_35 )   as bmcwn_35 ,
  sum(bmcwn_40 )   as bmcwn_40 ,
  sum(bmcwn_7  )   as bmcwn_7  ,
  sum(bmfol_0  )   as bmfol_0  ,
  sum(bmfol_15 )   as bmfol_15 ,
  sum(bmfol_2  )   as bmfol_2  ,
  sum(bmfol_25 )   as bmfol_25 ,
  sum(bmfol_35 )   as bmfol_35 ,
  sum(bmfol_40 )   as bmfol_40 ,
  sum(bmfol_7  )   as bmfol_7  ,
  sum(bmstm_0  )   as bmstm_0  ,
  sum(bmstm_15 )   as bmstm_15 ,
  sum(bmstm_2  )   as bmstm_2  ,
  sum(bmstm_25 )   as bmstm_25 ,
  sum(bmstm_35 )   as bmstm_35 ,
  sum(bmstm_40 )   as bmstm_40 ,
  sum(bmstm_7  )   as bmstm_7  ,
  sum(dbmcn_0  )   as dbmcn_0  ,
  sum(dbmcn_15 )   as dbmcn_15 ,
  sum(dbmcn_2  )   as dbmcn_2  ,
  sum(dbmcn_25 )   as dbmcn_25 ,
  sum(dbmcn_35 )   as dbmcn_35 ,
  sum(dbmcn_40 )   as dbmcn_40 ,
  sum(dbmcn_7  )   as dbmcn_7  ,
  sum(dbmsm_0  )   as dbmsm_0  ,
  sum(dbmsm_15 )   as dbmsm_15 ,
  sum(dbmsm_2  )   as dbmsm_2  ,
  sum(dbmsm_25 )   as dbmsm_25 ,
  sum(dbmsm_35 )   as dbmsm_35 ,
  sum(dbmsm_40 )   as dbmsm_40 ,
  sum(dbmsm_7  )   as dbmsm_7  ,
  sum(sng_0    )   as sng_0    ,
  sum(sng_15   )   as sng_15   ,
  sum(sng_2    )   as sng_2    ,
  sum(sng_25   )   as sng_25   ,
  sum(sng_35   )   as sng_35   ,
  sum(sng_40   )   as sng_40   ,
  sum(sng_7    )   as sng_7    ,
  sum(tpa_0    )   as tpa_0    ,
  sum(tpa_15   )   as tpa_15   ,
  sum(tpa_2    )   as tpa_2    ,
  sum(tpa_25   )   as tpa_25   ,
  sum(tpa_35   )   as tpa_35   ,
  sum(tpa_40   )   as tpa_40   ,
  sum(tpa_7    )   as tpa_7    ,
  sum(vmsg_0   )   as vmsg_0   ,
  sum(vmsg_15  )   as vmsg_15  ,
  sum(vmsg_2   )   as vmsg_2   ,
  sum(vmsg_25  )   as vmsg_25  ,
  sum(vmsg_35  )   as vmsg_35  ,
  sum(vmsg_40  )   as vmsg_40  ,
  sum(vmsg_7   )   as vmsg_7   ,
  sum(vol_15   )   as vol_15   ,
  sum(vol_2    )   as vol_2    ,
  sum(vol_25   )   as vol_25   ,
  sum(vol_35   )   as vol_35   ,
  sum(vol_40   )   as vol_40   ,
  sum(vol_7    )   as vol_7
  from pixels where cluster_no =31337
group by cluster_no, county, land_use, sit_raster, forest_type

-- copy from CSV import into pixels, no dupes
INSERT INTO public.pixels (county_name, ba_15, ba_2, ba_25, ba_35, ba_40, ba_7, bmcwn_15, bmcwn_2, bmcwn_25, bmcwn_35,
                           bmcwn_40, bmcwn_7, bmfol_15, bmfol_2, bmfol_25, bmfol_35, bmfol_40, bmfol_7, bmstm_15,
                           bmstm_2, bmstm_25, bmstm_35, bmstm_40, bmstm_7, dbmcn_15, dbmcn_2, dbmcn_25, dbmcn_35,
                           dbmcn_40, dbmcn_7, dbmsm_15, dbmsm_2, dbmsm_25, dbmsm_35, dbmsm_40, dbmsm_7, sng_15, sng_2,
                           sng_25, sng_35, sng_40, sng_7, tpa_15, tpa_2, tpa_25, tpa_35, tpa_40, tpa_7, vmsg_15, vmsg_2,
                           vmsg_25, vmsg_35, vmsg_40, vmsg_7, vol_15, vol_2, vol_25, vol_35, vol_40, vol_7, site_class,
                            land_use, lat, lng, cluster_no, forest_type, elevation)
select county_name,
       ba_15,
       ba_2,
       ba_25,
       ba_35,
       ba_40,
       ba_7,
       bmcwn_15,
       bmcwn_2,
       bmcwn_25,
       bmcwn_35,
       bmcwn_40,
       bmcwn_7,
       bmfol_15,
       bmfol_2,
       bmfol_25,
       bmfol_35,
       bmfol_40,
       bmfol_7,
       bmstm_15,
       bmstm_2,
       bmstm_25,
       bmstm_35,
       bmstm_40,
       bmstm_7,
       dbmcn_15,
       dbmcn_2,
       dbmcn_25,
       dbmcn_35,
       dbmcn_40,
       dbmcn_7,
       dbmsm_15,
       dbmsm_2,
       dbmsm_25,
       dbmsm_35,
       dbmsm_40,
       dbmsm_7,
       sng_15,
       sng_2,
       sng_25,
       sng_35,
       sng_40,
       sng_7,
       tpa_15,
       tpa_2,
       tpa_25,
       tpa_35,
       tpa_40,
       tpa_7,
       vmsg_15,
       vmsg_2,
       vmsg_25,
       vmsg_35,
       vmsg_40,
       vmsg_7,
       vol_15,
       vol_2,
       vol_25,
       vol_35,
       vol_40,
       vol_7,
       fl_sit,
       land_use,
       lat,
       lng,
       cluster_no,
       reg_d,
       elevation
from csvpixels
where not exists(select * from pixels where pixels.cluster_no = csvpixels.cluster_no);

-- copy table but update year
insert into treatedclusters
select cluster_no,
    treatmentid      ,
    2017             ,
    landing_lat      ,
    landing_lng      ,
    landing_elevation,
    center_lat       ,
    center_lng       ,
    center_elevation ,
    slope            ,
    area             ,
    mean_yarding     ,
    sit_raster       ,
    county           ,
    land_use         ,
    forest_type      ,
    ba_15            ,
    ba_2             ,
    ba_25            ,
    ba_35            ,
    ba_40            ,
    ba_7             ,
    bmcwn_15         ,
    bmcwn_2          ,
    bmcwn_25         ,
    bmcwn_35         ,
    bmcwn_40         ,
    bmcwn_7          ,
    bmfol_15         ,
    bmfol_2          ,
    bmfol_25         ,
    bmfol_35         ,
    bmfol_40         ,
    bmfol_7          ,
    bmstm_15         ,
    bmstm_2          ,
    bmstm_25         ,
    bmstm_35         ,
    bmstm_40         ,
    bmstm_7          ,
    dbmcn_15         ,
    dbmcn_2          ,
    dbmcn_25         ,
    dbmcn_35         ,
    dbmcn_40         ,
    dbmcn_7          ,
    dbmsm_15         ,
    dbmsm_2          ,
    dbmsm_25         ,
    dbmsm_35         ,
    dbmsm_40         ,
    dbmsm_7          ,
    sng_15           ,
    sng_2            ,
    sng_25           ,
    sng_35           ,
    sng_40           ,
    sng_7            ,
    tpa_15           ,
    tpa_2            ,
    tpa_25           ,
    tpa_35           ,
    tpa_40           ,
    tpa_7            ,
    vmsg_15          ,
    vmsg_2           ,
    vmsg_25          ,
    vmsg_35          ,
    vmsg_40          ,
    vmsg_7           ,
    vol_15           ,
    vol_2            ,
    vol_25           ,
    vol_35           ,
    vol_40           ,
    vol_7             from treatedclusters where year = 2016;


-- calculate percentage of biomass in different hazard zones 
with total as
    (select sum(
bmcwn_15+
bmcwn_2 +
bmcwn_25+
bmcwn_35+
bmcwn_40+
bmcwn_7 +
bmfol_15+
bmfol_2 +
bmfol_25+
bmfol_35+
bmfol_40+
bmfol_7 +
bmstm_15+
bmstm_2 +
bmstm_25+
bmstm_35+
bmstm_40+
bmstm_7 +
dbmcn_15+
dbmcn_2 +
dbmcn_25+
dbmcn_35+
dbmcn_40+
dbmcn_7 +
dbmsm_15+
dbmsm_2 +
dbmsm_25+
dbmsm_35+
dbmsm_40+
dbmsm_7 ) as total_biomass from treatedclusters),
 grouped_haz_class as (
select haz_class, sum(
bmcwn_15+
bmcwn_2 +
bmcwn_25+
bmcwn_35+
bmcwn_40+
bmcwn_7 +
bmfol_15+
bmfol_2 +
bmfol_25+
bmfol_35+
bmfol_40+
bmfol_7 +
bmstm_15+
bmstm_2 +
bmstm_25+
bmstm_35+
bmstm_40+
bmstm_7 +
dbmcn_15+
dbmcn_2 +
dbmcn_25+
dbmcn_35+
dbmcn_40+
dbmcn_7 +
dbmsm_15+
dbmsm_2 +
dbmsm_25+
dbmsm_35+
dbmsm_40+
dbmsm_7 ) as available_biomass from treatedclusters group by haz_class)
     select haz_class, available_biomass, total_biomass, (available_biomass * 100) / total_biomass as percent from total, grouped_haz_class