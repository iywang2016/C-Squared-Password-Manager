import { expect, test, describe, beforeAll } from 'vitest';
import { determineStrength, hasMatch } from './encrypt';
import { nextTick } from 'process';

describe('helper functions are reasonably correct', () => {
  test('too short password is correctly flagged as insecure', () => {
    expect(determineStrength("short")).toStrictEqual(
      ["Password is too short (minimum 15 characters)."]
    );
  })

  test('suffix matches are correctly identified - hardcoded hashes', () => {
    let list = [
      '0002EEFFB2CCA91812B5CC9956854E22BEB:4',
      '000F6468C6E4D09C0C239A4C2769501B3DD:5956',
      '00115AE168591C338025516216655E42A09:16',
      '0018A45C4D1DEF81644B54AB7F969B88D65:9',
      '0067AD792FB5BA36BECEF3506EE21E41DD9:59',
      '009F8BAECE04D85D02A358D8BAF99819D2F:10',
      '00BF5B8932DFD00FDB4A9529E7923068928:4',
      '00CF63A94500831584A7BBAB1CCF86CBE17:70',
      '00D4F6E8FA6EECAD2A3AA415EEC418D38EC:3',
      '011053FD0102E94D6AE2F8B83D76FAF94F6:1',
      '012A7CA357541F0AC487871FEEC1891C49C:13',
      '0136E006E24E7D152139815FB0FC6A50B15:0',
      '01561D5D4D893ADDA894DD9484C145323E3:0',
      '015FEFCF71A10576F1CDEBD4F3D3345903E:0'
    ];
    expect(hasMatch('0002EEFFB2CCA91812B5CC9956854E22BEB', list)).toBe(true);
    expect(hasMatch('0067AD792FB5BA36BECEF3506EE21E41DD9', list)).toBe(true);
    expect(hasMatch('015FEFCF71A10576F1CDEBD4F3D33459031', list)).toBe(false);
    expect(hasMatch('015FEFCF71A10576F1CDEBD4F3D3345903E', list)).toBe(false);
  })

  // TODO: failing - how to async in test??
  test('suffix matches are correctly identified after querying API', async () => {
    let prefix = '21BD1';
    let suffix = '0067AD792FB5BA36BECEF3506EE21E41DD9';
    
    const headers: Headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('Add-Padding', 'true'); // pads responses by random amount
    
    let site: string = "https://api.pwnedpasswords.com/range/" + prefix;
    const req: RequestInfo = new Request(site, { method: 'GET', headers: headers});

    // BAD 1
    // let list = fetch(req).then(res => res.json())
    //   .then(res => {return res as string[]});
    let list: string[];
    let res: Response;
    beforeAll(async() => {
      res = await fetch(req);
      list = await res.json();
    }, 5000);

    
    // await nextTick;
    // TODO: currently not working - async stuff :(
    expect(hasMatch(suffix, list), '\nand list was ' + list + '\n').toBe(true);
  })
})