import { marshal, unMarshal } from './marshaler';

describe('Marshaler', () => {
    test.each([
        new Map<string, string>([['1004', 'yes'], ['1005', 'no'], ['40001008', 'maybe'], ['1001', 'yes'], ['1002', 'no'], ['1003', 'maybe']]),
        new Map<string, string>([['1004', 'yes'], ['1005', 'no']]),
    ])('marshals and unmarshals the map correctly', (testMap: Map<string, string>) => {
        const marshaled = marshal(testMap);
        const unmarshaled = unMarshal(marshaled);
        expect(unmarshaled).toEqual(testMap);
    });

    it('compresses the map size', () => {
        const mapToTest = new Map(Array.from({ length: 5000 }, (_, i) => [(42579330 + i).toString(), 'yes']));
        const marshaled = marshal(mapToTest);
        console.log(marshaled.length);
        expect(marshaled.length).toBeLessThan(300);
    });
});
