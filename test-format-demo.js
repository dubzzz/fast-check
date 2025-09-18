// Test file to demonstrate format action
const   messy_object={
  name:"test",
  value :  123,
  nested: {
        deeply:
          "formatted"
  }
};

function   poorly_formatted   (   a,b,   c   ){
return {
...messy_object,
result:a+b+c
}
}

// This will be auto-formatted by the GitHub Action
export {poorly_formatted};