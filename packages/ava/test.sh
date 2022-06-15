#!/bin/sh

npm run ava-test >test/out.log 2>&1

for expectedContent in \
         "ok 1 - should never be executed (with seed=48) # SKIP" \
         "ok 2 - should run first" \
         "ok 3 - should run after" \
         "ok 4 - should run serially" \
         "ok 5 - should pass on truthy synchronous property" \
         "ok 6 - should pass on truthy asynchronous property" \
         "not ok 7 - should fail on falsy synchronous property" \
         "not ok 8 - should fail on falsy asynchronous property" \
         "not ok 9 - should fail with seed=4242 and path=\"25\" (with seed=4242)" "seed=4242 and path=\"25\"" \
         "ok 10 - should pass on followed plan" \
         "not ok 11 - should fail on not followed plan" \
         "ok 12 - should pass kitchen sink" \
         "not ok 13 - should fail kitchen sink" \
         "ok 14 - should pass as the property fails" \
         "not ok 15 - should fail as the property passes"
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
