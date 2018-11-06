#!/bin/sh

mkdir -p output
npm install

status=0

for testUnit in "async:1:1" "contains:6:0" "knight:15:1" "settings:0:1" "model:1:1" "tree:12:8"
do
    name=`echo "${testUnit}" | cut -d: -f1`
    success=`echo "${testUnit}" | cut -d: -f2`
    failure=`echo "${testUnit}" | cut -d: -f3`

    echo "Expect 'npm run test:${name}' to have ${success} passed and ${failure} failed"
    npm run "test:${name}" > "output/${name}" 2> /dev/null
    cat "output/${name}"

    if [ ${success} -ne 0 ]; then
        cat "output/${name}" | grep "  ${success} passing" >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "Failure [passing]"
            status=1
        fi
    fi
    if [ ${failure} -ne 0 ]; then
        cat "output/${name}" | grep "  ${failure} failing" >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "Failure [failing]"
            status=1
        fi
    fi
done

exit $status
