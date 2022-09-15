#!/bin/sh

yarn jest-test >test/out.log 2>&1

for expectedContent in \
        "● should fail on falsy synchronous property" \
        "● should fail on falsy asynchronous property" \
        "● should fail with seed=4242 and path=\"25\" (with seed=4242)" \
        "● should fail because passing (with seed=48)" \
        "● itProp › should fail on falsy synchronous property" \
        "● itProp › should fail on falsy asynchronous property" \
        "● itProp › should fail with seed=4242 and path=\"25\" (with seed=4242)" \
        "● itProp › should fail because passing (with seed=48)" \
        "● itProp › should fail for concurrent (with seed=4848)" \
        "● itProp › should fail for concurrent because passing (with seed=4848)"
do
    cat test/out.log | grep "${expectedContent}" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        cat test/out.log
        echo "=== TEST FAILED ==="
        echo "Unable to find: ${expectedContent}"
        exit 1
    fi
done

echo "TEST PASSED"
