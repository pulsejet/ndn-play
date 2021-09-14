#!/bin/bash

rm -f src/assets/types.d.ts.out

process () {
   # f1
    outfile="declare namespace $2 {" >> types.d.ts.out

    while IFS= read -r p; do
        if [[ $p == declare* ]] ; then
            lin=`echo "$p" | sed 's/declare *//'`
            outfile="$outfile\nexport $lin"
            continue
        fi

        if [[ $p == "export {"* ]] ; then
            continue
        fi

        outfile="$outfile\n$p"
    done < $1

    outfile="$outfile\n}\n\n"

    echo -e "$outfile" >> src/assets/types.d.ts.out

    rm $1
}

process "src/assets/user-types.d.ts.out" "t"

echo -e "const node = t.node;\n\n" >> src/assets/types.d.ts.out
echo -e "const ndn = t.ndn;\n\n" >> src/assets/types.d.ts.out

echo -e "declare function visualize(packet: any): void;\n\n" >> src/assets/types.d.ts.out
echo -e "declare function setGlobalCaptureFilter(filter: (packet: t.ICapturedPacket) => boolean): void;\n\n" >> src/assets/types.d.ts.out
