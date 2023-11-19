#!/bin/sh

npm run ava-test >test/out.log 2>&1

for expectedContent in \
         "ok [0-9]* - should never be executed (with seed=48) # SKIP" \
         "ok [0-9]* - should run first" \
         "ok [0-9]* - should run after" \
         "ok [0-9]* - should run serially" \
         "ok [0-9]* - should pass on no-failed asserts synchronous property" \
         "ok [0-9]* - should pass on no-failed asserts asynchronous property" \
         "not ok [0-9]* - should fail on failing asserts synchronous property" \
         "not ok [0-9]* - should fail on failing asserts asynchronous property" \
         "not ok [0-9]* - should fail on synchronous property not running any assertions even if returning undefined" \
         "not ok [0-9]* - should fail on asynchronous property not running any assertions even if returning undefined" \
         "not ok [0-9]* - should fail on synchronous property not running any assertions even if returning true" \
         "not ok [0-9]* - should fail on asynchronous property not running any assertions even if returning true" \
         "not ok [0-9]* - should fail on synchronous property not running any assertions returning false" \
         "not ok [0-9]* - should fail on asynchronous property not running any assertions returning false" \
         "ok [0-9]* - should pass on synchronous properties having only successful assertions even if returning false" \
         "ok [0-9]* - should pass on asynchronous properties having only successful assertions even if returning false" \
         "ok [0-9]* - should pass on property returning passing Observable" \
         "not ok [0-9]* - should fail on property returning failing Observable" \
         "not ok [0-9]* - should fail with seed=4242 and path=\"25\" (with seed=4242)" \
         "ok [0-9]* - should pass on followed plan" \
         "not ok [0-9]* - should fail on not followed plan" \
         "ok [0-9]* - should pass kitchen sink" \
         "not ok [0-9]* - should fail kitchen sink" \
         "ok [0-9]* - should pass as the property fails" \
         "not ok [0-9]* - should fail as the property passes"
do
    echo "Checking: ${expectedContent}"
    cat test/out.log | grep "^${expectedContent}" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        cat test/out.log
        echo "=== TEST FAILED ==="
        echo "Unable to find: ${expectedContent}"
        exit 1
    fi
done

echo "TEST PASSED"
