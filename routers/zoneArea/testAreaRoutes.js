import fs from 'fs';
import path from 'path';
import express from 'express';

const router = express.Router();

router.get('/get-zone-json', (req, res) => {
  const filePath = path.resolve('data/finalZoneData.json');
  const zoneQuery = req.query.zone;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Error reading the file', error: err });
    }

    try {
      const parsedData = JSON.parse(data);
      const structuredData = [];

      parsedData.results.forEach((item) => {
        const {
          zoneName,
          StateName,
          Districtname,
          'Sub-distname': subdistrictName,
          Officename,
          Pincode,
          'Village/Locality name': VillageName,
        } = item;

        if (zoneQuery && zoneName !== zoneQuery) {
          return;
        }

        let zone = structuredData.find((z) => z.zoneName === zoneName);
        if (!zone) {
          zone = { zoneName, states: [] };
          structuredData.push(zone);
        }

        let state = zone.states.find((s) => s.StateName === StateName);
        if (!state) {
          state = { StateName, districts: [] };
          zone.states.push(state);
        }

        let district = state.districts.find(
          (d) => d.Districtname === Districtname
        );
        if (!district) {
          district = { Districtname, subdistricts: [] };
          state.districts.push(district);
        }

        let subdistrict = district.subdistricts.find(
          (sub) => sub['Sub-distname'] === subdistrictName
        );
        if (!subdistrict) {
          subdistrict = { 'Sub-distname': subdistrictName, details: [] };
          district.subdistricts.push(subdistrict);
        }

        subdistrict.details.push({
          Officename,
          VillageName,
          Pincode,
        });
      });

      res.json(structuredData);
    } catch (parseErr) {
      res
        .status(500)
        .json({ message: 'Error parsing the JSON file', error: parseErr });
    }
  });
});

router.get('/get-state-json', (req, res) => {
  const filePath = path.resolve('data/finalZoneData.json');
  const limit = parseInt(req.query.limit, 10);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error reading the file',
        error: err,
      });
    }

    try {
      const parsedData = JSON.parse(data);
      const structuredData = [];

      const results = limit
        ? parsedData.results.slice(0, limit)
        : parsedData.results;

      const stateMap = new Map();
      const districtMap = new Map();
      const subdistrictMap = new Map();

      results.forEach((item) => {
        const {
          StateName,
          Districtname,
          'Sub-distname': subdistrictName,
          Officename,
          Pincode,
          'Village/Locality name': VillageName,
        } = item;

        if (!StateName || !Districtname || !subdistrictName || !VillageName) {
          return;
        }

        const stateKey = StateName.trim().toUpperCase();
        if (!stateMap.has(stateKey)) {
          stateMap.set(stateKey, {
            StateName: stateKey,
            districts: [],
          });
          structuredData.push(stateMap.get(stateKey));
        }

        const districtKey = `${stateKey}-${Districtname.trim().toUpperCase()}`;
        if (!districtMap.has(districtKey)) {
          const district = {
            Districtname: Districtname.trim().toUpperCase(),
            subdistricts: [],
          };
          stateMap.get(stateKey).districts.push(district);
          districtMap.set(districtKey, district);
        }

        const subdistrictKey = `${districtKey}-${subdistrictName.trim()}`;
        if (!subdistrictMap.has(subdistrictKey)) {
          const subdistrict = {
            'Sub-distname': subdistrictName.trim(),
            details: [],
          };
          districtMap.get(districtKey).subdistricts.push(subdistrict);
          subdistrictMap.set(subdistrictKey, subdistrict);
        }

        const existingVillage = subdistrictMap
          .get(subdistrictKey)
          .details.find((detail) => detail.VillageName === VillageName.trim());

        if (!existingVillage) {
          subdistrictMap.get(subdistrictKey).details.push({
            Officename: Officename?.trim(),
            VillageName: VillageName.trim(),
            Pincode: Pincode?.trim(),
          });
        }
      });

      structuredData.sort((a, b) => a.StateName.localeCompare(b.StateName));
      structuredData.forEach((state) => {
        state.districts.sort((a, b) =>
          a.Districtname.localeCompare(b.Districtname)
        );
        state.districts.forEach((district) => {
          district.subdistricts.sort((a, b) =>
            a['Sub-distname'].localeCompare(b['Sub-distname'])
          );
          district.subdistricts.forEach((subdistrict) => {
            subdistrict.details.sort((a, b) =>
              a.VillageName.localeCompare(b.VillageName)
            );
          });
        });
      });

      res.json({
        success: true,
        data: structuredData,
      });
    } catch (parseErr) {
      res.status(500).json({
        success: false,
        message: 'Error parsing the JSON file',
        error: parseErr.message,
      });
    }
  });
});

router.get('/get-zones', (req, res) => {
  const filePath = path.resolve('data/finalZoneData.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Error reading the file', error: err });
    }

    try {
      const parsedData = JSON.parse(data);
      const uniqueZones = new Set();

      parsedData.results.forEach((item) => {
        if (item.zoneName) {
          uniqueZones.add(item.zoneName);
        }
      });

      const zonesArray = Array.from(uniqueZones);

      res.json(zonesArray);
    } catch (parseErr) {
      res
        .status(500)
        .json({ message: 'Error parsing the JSON file', error: parseErr });
    }
  });
});

export default router;
