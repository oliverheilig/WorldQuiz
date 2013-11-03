

function randomize(seed) {
    var KK = 100;
    var LL =  37;

    var mod_sum = function (x, y) {
        return x+y-(x+y|0);
    };

    var ran_u = Array(KK);

    var ranf_array = function (aa, n) {
        var i,j;
        for (j=0;j<KK;j++)
            aa[j]=ran_u[j];
        for (;j<n;j++)
            aa[j] = aa[j-KK] + aa[j-LL] - (aa[j-KK] + aa[j-LL] | 0);
        for (i=0;i<LL;i++,j++)
            ran_u[i] = aa[j-KK] + aa[j-LL] - (aa[j-KK] + aa[j-LL] | 0);
        for (;i<KK;i++,j++)
            ran_u[i] = aa[j-KK] + ran_u[i-LL] - (aa[j-KK] + ran_u[i-LL] | 0);
    };

    var ranf_start = function (seed) {
        var t,s,j;
        var u = Array(KK+KK-1);
        var ulp=(1.0/(1<<30))/(1<<22);               /* 2 to the -52 */
        var ss=2.0*ulp*((seed&0x3fffffff)+2);
        var TT = 70;  /* guaranteed separation between streams */

        function is_odd (s) {
            return ((s)&1);
        }

        for (j=0;j<KK;j++) {
            u[j]=ss;                                /* bootstrap the buffer */
            ss+=ss; if (ss>=1.0) ss-=1.0-2*ulp;  /* cyclic shift of 51 bits */
        }
        u[1]+=ulp;                     /* make u[1] (and only u[1]) "odd" */
        for (s=seed&0x3fffffff,t=TT-1; t; ) {
            for (j=KK-1;j>0;j--)
                u[j+j]=u[j],u[j+j-1]=0.0;                         /* "square" */
            for (j=KK+KK-2;j>=KK;j--) {
                u[j-(KK-LL)]=mod_sum(u[j-(KK-LL)],u[j]);
                u[j-KK]=mod_sum(u[j-KK],u[j]);
            }
            if (is_odd(s)) {                             /* "multiply by z" */
                for (j=KK;j>0;j--) u[j]=u[j-1];
                u[0]=u[KK];                         /* shift the buffer cyclically */
                u[LL]=mod_sum(u[LL],u[KK]);
            }
            if (s) s>>=1; else t--;
        }
        for (j=0;j<LL;j++) ran_u[j+KK-LL]=u[j];
        for (;j<KK;j++) ran_u[j-LL]=u[j];
        for (j=0;j<10;j++) ranf_array(u,KK+KK-1);  /* warm things up */
    };

    
    function getHashCode(s){
	var hash = 0;
	if (s.length == 0) return hash;
	for (i = 0; i < s.length; i++) {
		char = s.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
    }
    
    /* Usage */
    var a = Array(1009), i = 0;
    ranf_start(getHashCode(seed.toLowerCase()));
    ranf_array(a,1009);
    window.random = function () {
        1009 === i && (seed = a[i-1], i = 0, ranf_start(seed), ranf_array(a, 1009));
        return a[i++];
    };
};

randomize("1236");

function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter--) {
        // Pick a random index
        index = (random() * counter) | 0;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}


